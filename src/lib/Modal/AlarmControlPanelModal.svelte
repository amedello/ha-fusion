<script lang="ts">
	import { states, lang, ripple, connection, motion } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import StateLogic from '$lib/Components/StateLogic.svelte';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';
	import { callService } from 'home-assistant-js-websocket';
	import { onDestroy } from 'svelte';

	export let isOpen: boolean;
	export let sel: any;

	$: entity = $states[sel?.entity_id];
	$: entity_id = entity?.entity_id;
	$: state = entity?.state;
	$: attributes = entity?.attributes;

	// HA AlarmControlPanelEntityFeature bitmask values
	const FEATURES = {
		ARM_HOME: 1,
		ARM_AWAY: 2,
		ARM_NIGHT: 4,
		ARM_VACATION: 8,
		ARM_CUSTOM_BYPASS: 16,
		TRIGGER: 32
	};

	$: supported_features = attributes?.supported_features ?? 0;
	$: code_format = attributes?.code_format ?? null; // null | 'number' | 'text'
	$: code_arm_required = attributes?.code_arm_required ?? true;
	$: code_disarm_required = attributes?.code_disarm_required ?? true;

	$: supports = (feature: number) => (supported_features & feature) !== 0;

	// is the current state "armed" (any variant)?
	$: isArmed = state !== 'disarmed';

	// does the current action require a code?
	// if armed → we're disarming → check code_disarm_required
	// if disarmed → we're arming → check code_arm_required
	$: needsCode =
		code_format !== null && (isArmed ? code_disarm_required : code_arm_required);

	$: showKeypad = needsCode && code_format === 'number';
	$: showTextInput = needsCode && code_format === 'text';

	let code = '';
	let reject = false;
	let selectedService: string | undefined;
	let timeout: ReturnType<typeof setTimeout> | undefined;

	function addCode(key: number) {
		code += key;
	}

	function clearCode() {
		code = '';
	}

	async function executeService(service: string) {
		try {
			const serviceData: Record<string, string> = { entity_id };
			// only include code if it's actually required and provided
			if (needsCode && code) serviceData.code = code;

			await callService($connection, 'alarm_control_panel', service, serviceData);

			selectedService = undefined;
			clearCode();
		} catch (error: any) {
			if (error.message === 'Invalid alarm code provided') {
				reject = true;
				timeout = setTimeout(() => {
					reject = false;
				}, 600);
			}
		}
	}

	async function handleAction(service: string) {
		if (needsCode) {
			// select mode and wait for code input
			selectedService = service;
		} else {
			// no code needed: execute immediately
			await executeService(service);
		}
	}

	async function enterCode() {
		if (needsCode && !code) return;
		const service = selectedService ?? (isArmed ? 'alarm_disarm' : 'alarm_arm_away');
		await executeService(service);
	}

	onDestroy(() => {
		clearTimeout(timeout);
	});

	// build options list filtered by supported_features
	// disarm is always available
	$: modeOptions = [
		supports(FEATURES.ARM_HOME) && {
			id: 'alarm_arm_home',
			icon: 'mdi:home',
			label: $lang('alarm_modes_armed_home')
		},
		supports(FEATURES.ARM_AWAY) && {
			id: 'alarm_arm_away',
			icon: 'mdi:lock',
			label: $lang('alarm_modes_armed_away')
		},
		supports(FEATURES.ARM_NIGHT) && {
			id: 'alarm_arm_night',
			icon: 'mdi:moon-waning-crescent',
			label: $lang('alarm_modes_armed_night')
		},
		supports(FEATURES.ARM_VACATION) && {
			id: 'alarm_arm_vacation',
			icon: 'mdi:airplane',
			label: $lang('alarm_modes_armed_vacation')
		},
		supports(FEATURES.ARM_CUSTOM_BYPASS) && {
			id: 'alarm_arm_custom_bypass',
			icon: 'mdi:shield-half-full',
			label: $lang('alarm_modes_armed_custom_bypass')
		},
		{
			id: 'alarm_disarm',
			icon: 'mdi:shield-off',
			label: $lang('alarm_modes_disarmed')
		}
	].filter(Boolean) as { id: string; icon: string; label: string }[];
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{getName(sel, entity)}</h1>

		<h2>{$lang('state')}</h2>

		<span class:arming={state === 'arming'}>
			<StateLogic entity_id={sel?.entity_id} selected={sel} />
		</span>

		<!-- Mode buttons — always shown, filtered by supported_features -->
		<h2>{$lang('alarm_modes_label')}</h2>

		<div class="mode-buttons">
			{#each modeOptions as option}
				<button
					class="mode-btn"
					class:active={selectedService === option.id}
					on:click={() => handleAction(option.id)}
					use:Ripple={$ripple}
				>
					<Icon icon={option.icon} height="none" style="width: 1.4rem;" />
					{option.label}
				</button>
			{/each}
		</div>

		<!-- Code input — only shown if code is required for this action -->
		{#if needsCode && (selectedService || isArmed)}
			<div class="container">
				{#if showTextInput}
					<input
						type="text"
						class:reject
						bind:value={code}
						placeholder={$lang('code')}
						on:keydown={(e) => e.key === 'Enter' && enterCode()}
					/>
					<div class="text-confirm">
						<button
							on:click={clearCode}
							use:Ripple={$ripple}
							style:background-color={code === '' ? '' : '#422522'}
							style:transition="background-color {$motion}ms ease"
						>
							<Icon
								icon="gravity-ui:xmark"
								height="none"
								style={`width: 1.65rem; ${code === '' ? '' : `color: #e15241;`}`}
							/>
						</button>
						<button on:click={enterCode} use:Ripple={$ripple} style:background-color="#293828">
							<Icon icon="gravity-ui:check" height="none" style="width: 1.8rem; color: #67ad5b;" />
						</button>
					</div>
				{:else if showKeypad}
					<input type="password" class:reject bind:value={code} />
					<div class="buttons">
						{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as digit}
							<button on:click={() => addCode(digit)} use:Ripple={$ripple}>
								{digit}
							</button>
						{/each}

						<button
							on:click={clearCode}
							use:Ripple={$ripple}
							style:background-color={code === '' ? '' : '#422522'}
							style:transition="background-color {$motion}ms ease"
						>
							<Icon
								icon="gravity-ui:xmark"
								height="none"
								style={`width: 1.65rem; ${
									code === '' ? '' : `color: #e15241; transition: background-color ${$motion}ms ease;`
								}`}
							/>
						</button>

						<button on:click={() => addCode(0)} use:Ripple={$ripple}>0</button>

						<button on:click={enterCode} use:Ripple={$ripple} style:background-color="#293828">
							<Icon icon="gravity-ui:check" height="none" style="width: 1.8rem; color: #67ad5b;" />
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</Modal>
{/if}

<style>
	.mode-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.2rem;
	}

	.mode-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 1rem;
		background-color: var(--theme-button-background-color-off);
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 1rem;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background-color 150ms ease;
	}

	.mode-btn.active {
		border-color: rgba(255, 255, 255, 0.4);
		background-color: rgba(255, 255, 255, 0.1);
	}

	.container {
		display: grid;
	}

	input[type='password'],
	input[type='text'] {
		text-align: center;
		font-size: 3.2rem;
		border: none;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		width: 20rem;
		margin: 2rem auto;
		outline: none;
		border-radius: 0.4rem 0.4rem 0 0;
		background: var(--theme-button-background-color-off);
	}

	input[type='text'] {
		font-size: 1.5rem;
		padding: 0.5rem;
	}

	.buttons {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		column-gap: 2.2rem;
		row-gap: 1.2rem;
		margin: auto;
		margin-bottom: 2.5rem;
	}

	.text-confirm {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	button {
		cursor: pointer;
		user-select: none;
		background-color: var(--theme-button-background-color-off);
		border-radius: 50%;
		width: 4.5rem;
		height: 4.5rem;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.5rem;
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.reject {
		animation: shake 500ms linear;
	}

	@keyframes shake {
		8%,
		41% {
			transform: translateX(-10px);
		}
		25%,
		58% {
			transform: translateX(10px);
		}
		75% {
			transform: translateX(-5px);
		}
		92% {
			transform: translateX(5px);
		}
		0%,
		100% {
			transform: translateX(0);
		}
	}

	.arming {
		animation: blink 800ms linear infinite;
	}

	@keyframes blink {
		0% {
			opacity: 0;
		}
		50% {
			opacity: 0.5;
		}
		100% {
			opacity: 1;
		}
	}
</style>
