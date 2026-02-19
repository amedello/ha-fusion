<script lang="ts">
	import { connection, lang, states, ripple } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { getName, getSupport } from '$lib/Utils';
	import Select from '$lib/Components/Select.svelte';
	import { callService } from 'home-assistant-js-websocket';
	import Ripple from 'svelte-ripple';
	import Icon from '@iconify/svelte';

	export let isOpen: boolean;
	export let sel: any;

	$: entity = $states[sel?.entity_id];
	$: state = entity?.state;
	$: attributes = entity?.attributes;
	$: supported_features = attributes?.supported_features;

	$: supports = getSupport(supported_features, {
		TURN_ON: 1,
		TURN_OFF: 2,
		PAUSE: 4,
		STOP: 8,
		RETURN_HOME: 16,
		FAN_SPEED: 32,
		BATTERY: 64,
		STATUS: 128,
		SEND_COMMAND: 256,
		LOCATE: 512,
		CLEAN_SPOT: 1024,
		MAP: 2048,
		STATE: 4096,
		START: 8192
	});

	// Entity prefix (e.g. 'vacuum.pasquale' -> 'pasquale')
	$: entityPrefix = sel?.entity_id?.split('.')?.[1];

	// Map camera entity
	$: mapCamera = $states[`camera.${entityPrefix}_map`];
	$: mapUrl = mapCamera?.attributes?.entity_picture;

	// Battery
	$: battery = attributes?.battery;
	$: batteryIcon =
		battery === undefined
			? 'mdi:battery-unknown'
			: battery >= 90
				? 'mdi:battery'
				: battery >= 70
					? 'mdi:battery-70'
					: battery >= 50
						? 'mdi:battery-50'
						: battery >= 30
							? 'mdi:battery-30'
							: battery >= 10
								? 'mdi:battery-10'
								: 'mdi:battery-alert';

	// State icon
	$: stateIcon =
		state === 'cleaning'
			? 'mdi:robot-vacuum'
			: state === 'paused'
				? 'mdi:pause-circle-outline'
				: state === 'returning'
					? 'mdi:home-import-outline'
					: state === 'docked'
						? 'mdi:ev-station'
						: state === 'error'
							? 'mdi:alert-circle-outline'
							: 'mdi:robot-vacuum-variant';

	// Standard fan speed options
	$: fanSpeedOptions = attributes?.fan_speed_list?.map((o: string) => ({ id: o, label: o }));

	// Dreame-specific selects (only shown if attribute exists)
	$: cleaningModeOptions = attributes?.cleaning_mode_list?.map((o: string) => ({
		id: o,
		label: o
	}));
	$: suctionLevelOptions = attributes?.suction_level_list?.map((o: string) => ({
		id: o,
		label: o
	}));
	$: mopHumidityOptions = attributes?.mop_pad_humidity_list?.map((o: string) => ({
		id: o,
		label: o
	}));

	// Shortcuts - button.[prefix]_shortcut_* entities
	$: shortcuts = Object.values($states)
		.filter((e) => e.entity_id.startsWith(`button.${entityPrefix}_shortcut_`) && e.attributes?.name)
		.sort((a, b) => (a.attributes?.index ?? 0) - (b.attributes?.index ?? 0));

	function handleClick(service: string) {
		callService($connection, 'vacuum', service, {
			entity_id: entity?.entity_id
		});
	}

	function handleFanSpeed(fan_speed: string) {
		callService($connection, 'vacuum', 'set_fan_speed', {
			entity_id: entity?.entity_id,
			fan_speed
		});
	}

	function handleShortcut(shortcutEntityId: string) {
		callService($connection, 'button', 'press', {
			entity_id: shortcutEntityId
		});
	}

	function handleDreameSelect(service: string, attribute: string, value: string) {
		callService($connection, 'dreame_vacuum', service, {
			entity_id: entity?.entity_id,
			[attribute]: value
		});
	}
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{getName(sel, entity)}</h1>

		<!-- STATUS ROW -->
		<div class="status-row">
			<div class="status-item">
				<Icon icon={stateIcon} height="1.3rem" />
				<span>{$lang(state) || state}</span>
			</div>
			{#if battery !== undefined}
				<div class="status-item">
					<Icon icon={batteryIcon} height="1.3rem" />
					<span>{battery}%</span>
				</div>
			{/if}
			{#if attributes?.cleaned_area}
				<div class="status-item">
					<Icon icon="mdi:floor-plan" height="1.3rem" />
					<span>{attributes.cleaned_area} m²</span>
				</div>
			{/if}
			{#if attributes?.cleaning_time}
				<div class="status-item">
					<Icon icon="mdi:timer-outline" height="1.3rem" />
					<span>{attributes.cleaning_time} min</span>
				</div>
			{/if}
		</div>

		<!-- MAP -->
		{#if mapUrl}
			<h2>{$lang('map') || 'Mappa'}</h2>
			<img src={mapUrl} alt="vacuum map" class="vacuum-map" />
		{/if}

		<!-- CONTROLS -->
		<h2>{$lang('vacuum_commands')?.replace(':', '') || 'Comandi'}</h2>

		<div class="button-container">
			{#if supports?.TURN_ON}
				<button
					title={$lang('on')}
					class:selected={state === 'on'}
					on:click={() => handleClick('turn_on')}
					use:Ripple={$ripple}
				>
					<div class="icon"><Icon icon="mdi:power-on" height="none" /></div>
				</button>
			{/if}

			{#if supports?.START}
				<button
					title={$lang('start')}
					class:selected={state === 'cleaning'}
					on:click={() => handleClick('start')}
					use:Ripple={$ripple}
				>
					<div class="icon"><Icon icon="ic:round-play-arrow" height="none" /></div>
				</button>
			{/if}

			{#if supports?.PAUSE}
				<button
					title={$lang('pause')}
					class:selected={state === 'paused'}
					on:click={() => handleClick('pause')}
					use:Ripple={$ripple}
				>
					<div class="icon"><Icon icon="ic:round-pause" height="none" /></div>
				</button>
			{/if}

			{#if supports?.STOP}
				<button title={$lang('stop')} on:click={() => handleClick('stop')} use:Ripple={$ripple}>
					<div class="icon"><Icon icon="ic:round-stop" height="none" /></div>
				</button>
			{/if}

			{#if supports?.RETURN_HOME}
				<button
					title={$lang('return_home')}
					class:selected={state === 'returning'}
					on:click={() => handleClick('return_to_base')}
					use:Ripple={$ripple}
				>
					<div class="icon"><Icon icon="ic:round-home" height="none" /></div>
				</button>
			{/if}

			{#if supports?.LOCATE}
				<button title={$lang('locate')} on:click={() => handleClick('locate')} use:Ripple={$ripple}>
					<div class="icon"><Icon icon="mdi:map-marker" height="none" /></div>
				</button>
			{/if}

			{#if supports?.TURN_OFF}
				<button
					title={$lang('off')}
					class:selected={state === 'off'}
					on:click={() => handleClick('turn_off')}
					use:Ripple={$ripple}
				>
					<div class="icon"><Icon icon="mdi:power-off" height="none" /></div>
				</button>
			{/if}
		</div>

		<!-- FAN SPEED (standard HA) -->
		{#if supports?.FAN_SPEED && fanSpeedOptions}
			<h2>{$lang('fan_speed')}</h2>
			<Select
				options={fanSpeedOptions}
				placeholder={$lang('options')}
				value={attributes?.fan_speed}
				on:change={(event) => handleFanSpeed(event?.detail)}
			/>
		{/if}

		<!-- DREAME: CLEANING MODE -->
		{#if cleaningModeOptions}
			<h2>{$lang('cleaning_mode')}</h2>
			<Select
				options={cleaningModeOptions}
				placeholder={attributes?.cleaning_mode}
				value={attributes?.cleaning_mode}
				on:change={(e) => handleDreameSelect('set_cleaning_mode', 'cleaning_mode', e?.detail)}
			/>
		{/if}

		<!-- DREAME: SUCTION LEVEL -->
		{#if suctionLevelOptions}
			<h2>{$lang('suction_level')}</h2>
			<Select
				options={suctionLevelOptions}
				placeholder={attributes?.suction_level}
				value={attributes?.suction_level}
				on:change={(e) => handleDreameSelect('set_suction_level', 'suction_level', e?.detail)}
			/>
		{/if}

		<!-- DREAME: MOP HUMIDITY -->
		{#if mopHumidityOptions}
			<h2>{$lang('mop_pad_humidity')}</h2>
			<Select
				options={mopHumidityOptions}
				placeholder={attributes?.mop_pad_humidity}
				value={attributes?.mop_pad_humidity}
				on:change={(e) => handleDreameSelect('set_mop_pad_humidity', 'mop_pad_humidity', e?.detail)}
			/>
		{/if}

		<!-- SHORTCUTS -->
		{#if shortcuts.length > 0}
			<h2>{$lang('shortcuts') || 'Scorciatoie'}</h2>
			<div class="button-container" style="flex-wrap: wrap;">
				{#each shortcuts as shortcut}
					<button on:click={() => handleShortcut(shortcut.entity_id)} use:Ripple={$ripple}>
						{shortcut.attributes?.name}
					</button>
				{/each}
			</div>
		{/if}

		<ConfigButtons />
	</Modal>
{/if}

<style>
	.status-row {
		display: flex;
		gap: 1.2rem;
		flex-wrap: wrap;
		margin-bottom: 0.4rem;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		opacity: 0.85;
		font-size: 0.95rem;
	}

	.vacuum-map {
		width: 100%;
		display: block;
		border-radius: 0.6rem;
	}

	.button-container > button {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.icon {
		width: 1.6rem;
		height: 1.6rem;
	}
</style>
