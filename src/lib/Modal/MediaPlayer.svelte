<script lang="ts">
	import { states, connection, lang, ripple, selectedLanguage } from '$lib/Stores';
	import { onMount, onDestroy } from 'svelte';
	import { callService } from 'home-assistant-js-websocket';
	import Ripple from 'svelte-ripple';
	import RangeSlider from '$lib/Components/RangeSlider.svelte';
	import Icon from '@iconify/svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Select from '$lib/Components/Select.svelte';
	import { getName, getSupport } from '$lib/Utils';

	export let isOpen: boolean;
	export let sel: any;

	// Position tracking
	let tick = Date.now();
	let interval: ReturnType<typeof setInterval>;
	let isDragging = false;
	let debouncePosition = false;
	let debounceTimeout: ReturnType<typeof setTimeout>;
	let rangeValue: number = 0;
	let currentSliderValue = 0;
	let pendingSeek = false;
	let nextSeekPosition: number | undefined = undefined;

	const DEBOUNCE_INTERVAL = 2500;

	$: entity = $states[sel?.entity_id];
	$: attributes = entity?.attributes;
	$: state = entity?.state;
	$: playing = state === 'playing';

	$: supported_features = attributes?.supported_features;

	$: supports = getSupport(supported_features, {
		PAUSE: 1,
		SEEK: 2,
		VOLUME_SET: 4,
		VOLUME_MUTE: 8,
		PREVIOUS_TRACK: 16,
		NEXT_TRACK: 32,
		TURN_ON: 128,
		TURN_OFF: 256,
		PLAY_MEDIA: 512,
		VOLUME_BUTTONS: 1024,
		SELECT_SOURCE: 2048,
		STOP: 4096,
		PLAY: 16384,
		SHUFFLE_SET: 32768,
		SELECT_SOUND_MODE: 65536,
		REPEAT_SET: 262144
	});

	// Position slider
	$: updated_at = new Date(attributes?.media_position_updated_at).getTime();
	$: diff = (tick - updated_at) / 1000;
	$: livePosition = (attributes?.media_position ?? 0) + (playing ? diff : 0);
	$: if (!debouncePosition && !isDragging) {
		rangeValue = Math.min(livePosition, attributes?.media_duration ?? 0);
	}

	// Volume
	$: volumeLevel = attributes?.volume_level ?? 0;
	$: isMuted = attributes?.is_volume_muted ?? false;

	// Repeat cycle: off → one → all → off
	const repeatModes = ['off', 'one', 'all'];
	$: repeatMode = attributes?.repeat ?? 'off';
	$: repeatIcon =
		repeatMode === 'one'
			? 'ic:round-repeat-one'
			: repeatMode === 'all'
				? 'ic:round-repeat'
				: 'ic:round-repeat';
	$: repeatActive = repeatMode !== 'off';

	$: shuffleActive = attributes?.shuffle ?? false;

	// Source
	$: source = attributes?.source;
	$: sourceList = attributes?.source_list ?? [];
	$: sourceOptions = sourceList.map((s: string) => ({ id: s, label: s }));

	// Sound mode
	$: soundMode = attributes?.sound_mode;
	$: soundModeList = attributes?.sound_mode_list ?? [];
	$: soundModeOptions = soundModeList.map((m: string) => ({ id: m, label: m }));

	onMount(() => {
		if (playing) startTick();
	});

	$: if (playing) {
		startTick();
	} else {
		stopTick();
		tick = Date.now();
	}

	function startTick() {
		if (interval) return;
		interval = setInterval(() => {
			tick = Date.now();
		}, 1000);
	}

	function stopTick() {
		clearInterval(interval);
		interval = undefined as any;
	}

	onDestroy(() => {
		stopTick();
		clearTimeout(debounceTimeout);
	});

	function call(service: string, data: Record<string, any> = {}) {
		callService($connection, 'media_player', service, {
			entity_id: entity?.entity_id,
			...data
		});
	}

	// Seek with debounce + queue
	async function handleSeek(value: number) {
		currentSliderValue = value;
		debouncePosition = true;
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			debouncePosition = false;
		}, DEBOUNCE_INTERVAL);

		if (pendingSeek) {
			nextSeekPosition = value;
		} else {
			pendingSeek = true;
			try {
				await callService($connection, 'media_player', 'media_seek', {
					entity_id: entity?.entity_id,
					seek_position: value
				});
			} catch (err) {
				console.error('Seek failed:', err);
			}
			pendingSeek = false;
			if (nextSeekPosition !== undefined && nextSeekPosition !== value) {
				const pos = nextSeekPosition;
				nextSeekPosition = undefined;
				handleSeek(pos);
			}
		}
	}

	function handleVolumeChange(value: number) {
		call('volume_set', { volume_level: Math.round(value * 100) / 100 });
	}

	function handleRepeatToggle() {
		const current = repeatModes.indexOf(repeatMode);
		const next = repeatModes[(current + 1) % repeatModes.length];
		call('repeat_set', { repeat: next });
	}

	function convertToHMS(seconds: number): string {
		if (!seconds && seconds !== 0) return '0:00';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		const hDisplay = h > 0 ? h + ':' : '';
		const mDisplay = (h > 0 && m < 10 ? '0' : '') + m + ':';
		const sDisplay = s < 10 ? '0' + s : String(s);
		return hDisplay + mDisplay + sDisplay;
	}
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{getName(sel, entity)}</h1>

		<!-- ARTWORK + MEDIA INFO -->
		{#if attributes?.entity_picture}
			<img
				class="media-player-img"
				src={attributes.entity_picture}
				alt={attributes?.media_title ?? ''}
			/>
		{/if}

		{#if attributes?.media_title || attributes?.media_artist || attributes?.media_album_name}
			<div class="media-info">
				{#if attributes?.media_title}
					<div class="media-title">{attributes.media_title}</div>
				{/if}
				{#if attributes?.media_artist}
					<div class="media-subtitle">{attributes.media_artist}</div>
				{/if}
				{#if attributes?.media_album_name}
					<div class="media-subtitle">{attributes.media_album_name}</div>
				{/if}
			</div>
		{/if}

		<!-- STATE -->
		{#if state && state !== 'playing'}
			<h2>{$lang(state) || state}</h2>
		{/if}

		<!-- SEEK -->
		{#if supports?.SEEK && attributes?.media_duration !== undefined && attributes?.media_position !== undefined}
			<div class="time-container">
				<span
					>{isDragging || debouncePosition
						? convertToHMS(currentSliderValue)
						: convertToHMS(rangeValue)}</span
				>
				<span>{convertToHMS(attributes.media_duration)}</span>
			</div>

			<RangeSlider
				value={rangeValue}
				min={0}
				max={attributes.media_duration}
				on:input={(e) => handleSeek(e.detail)}
				on:dragging={(e) => {
					isDragging = e.detail;
					if (e.detail) clearTimeout(debounceTimeout);
				}}
			/>
		{/if}

		<!-- TRANSPORT CONTROLS -->
		<div class="controls">
			<!-- Shuffle -->
			{#if supports?.SHUFFLE_SET}
				<button
					class="icon-btn small"
					class:active={shuffleActive}
					on:click={() => call('shuffle_set', { shuffle: !shuffleActive })}
					use:Ripple={$ripple}
					title="Shuffle"
				>
					<Icon icon="ic:round-shuffle" height="none" />
				</button>
			{:else}
				<div class="spacer" />
			{/if}

			<!-- Previous -->
			{#if supports?.PREVIOUS_TRACK}
				<button
					class="icon-btn"
					on:click={() => call('media_previous_track')}
					use:Ripple={$ripple}
					title={$lang('previous_track')}
				>
					<Icon icon="ic:round-skip-previous" height="none" />
				</button>
			{/if}

			<!-- Play / Pause / Stop -->
			{#if playing}
				{#if supports?.PAUSE}
					<button
						class="icon-btn main"
						on:click={() => call('media_pause')}
						use:Ripple={$ripple}
						title={$lang('pause')}
					>
						<Icon icon="ic:round-pause" height="none" />
					</button>
				{:else if supports?.STOP}
					<button
						class="icon-btn main"
						on:click={() => call('media_stop')}
						use:Ripple={$ripple}
						title={$lang('stop')}
					>
						<Icon icon="ic:round-stop" height="none" />
					</button>
				{/if}
			{:else if supports?.PLAY}
				<button
					class="icon-btn main"
					on:click={() => call('media_play')}
					use:Ripple={$ripple}
					title={$lang('play')}
				>
					<Icon icon="ic:round-play-arrow" height="none" />
				</button>
			{:else if supports?.TURN_ON && (state === 'off' || state === 'unavailable')}
				<button
					class="icon-btn main"
					on:click={() => call('turn_on')}
					use:Ripple={$ripple}
					title={$lang('turn_on')}
				>
					<Icon icon="ic:round-power-settings-new" height="none" />
				</button>
			{/if}

			<!-- Next -->
			{#if supports?.NEXT_TRACK}
				<button
					class="icon-btn"
					on:click={() => call('media_next_track')}
					use:Ripple={$ripple}
					title={$lang('next_track')}
				>
					<Icon icon="ic:round-skip-next" height="none" />
				</button>
			{/if}

			<!-- Repeat -->
			{#if supports?.REPEAT_SET}
				<button
					class="icon-btn small"
					class:active={repeatActive}
					on:click={handleRepeatToggle}
					use:Ripple={$ripple}
					title="Repeat: {repeatMode}"
				>
					<Icon icon={repeatIcon} height="none" />
				</button>
			{:else if supports?.TURN_OFF && state !== 'off' && state !== 'unavailable'}
				<button
					class="icon-btn small power-off"
					on:click={() => call('turn_off')}
					use:Ripple={$ripple}
					title={$lang('turn_off')}
				>
					<Icon icon="ic:round-power-settings-new" height="none" />
				</button>
			{:else}
				<div class="spacer" />
			{/if}

			<!-- Power off (when repeat is also shown) -->
			{#if supports?.REPEAT_SET && supports?.TURN_OFF && state !== 'off' && state !== 'unavailable'}
				<button
					class="icon-btn small power-off"
					on:click={() => call('turn_off')}
					use:Ripple={$ripple}
					title={$lang('turn_off')}
				>
					<Icon icon="ic:round-power-settings-new" height="none" />
				</button>
			{/if}
		</div>

		<!-- VOLUME -->
		{#if supports?.VOLUME_SET}
			<h2>
				{$lang('volume_level')}
				<span class="align-right">
					{Intl.NumberFormat($selectedLanguage, { style: 'percent' }).format(
						isMuted ? 0 : volumeLevel
					)}
				</span>
			</h2>

			<div class="volume-row">
				{#if supports?.VOLUME_MUTE}
					<button
						class="icon-btn small"
						class:active={isMuted}
						on:click={() => call('volume_mute', { is_volume_muted: !isMuted })}
						use:Ripple={$ripple}
						title={$lang('mute')}
					>
						<Icon icon={isMuted ? 'ic:round-volume-off' : 'ic:round-volume-up'} height="none" />
					</button>
				{/if}

				<div class="volume-slider">
					<RangeSlider
						value={isMuted ? 0 : volumeLevel}
						min={0}
						max={1}
						on:change={(e) => handleVolumeChange(e.detail)}
					/>
				</div>
			</div>
		{:else if supports?.VOLUME_BUTTONS}
			<h2>{$lang('volume_level')}</h2>
			<div class="vol-buttons">
				<button class="icon-btn" on:click={() => call('volume_down')} use:Ripple={$ripple}>
					<Icon icon="ic:round-volume-down" height="none" />
				</button>
				{#if supports?.VOLUME_MUTE}
					<button
						class="icon-btn"
						class:active={isMuted}
						on:click={() => call('volume_mute', { is_volume_muted: !isMuted })}
						use:Ripple={$ripple}
					>
						<Icon icon={isMuted ? 'ic:round-volume-off' : 'ic:round-volume-mute'} height="none" />
					</button>
				{/if}
				<button class="icon-btn" on:click={() => call('volume_up')} use:Ripple={$ripple}>
					<Icon icon="ic:round-volume-up" height="none" />
				</button>
			</div>
		{/if}

		<!-- SOURCE SELECT -->
		{#if supports?.SELECT_SOURCE && sourceList.length > 0}
			<h2>{$lang('source')}</h2>
			<Select
				value={source}
				placeholder={$lang('source') ?? 'Source'}
				options={sourceOptions}
				on:change={(event) => {
					if (event?.detail) call('select_source', { source: event.detail });
				}}
			/>
		{/if}

		<!-- SOUND MODE -->
		{#if supports?.SELECT_SOUND_MODE && soundModeList.length > 0}
			<h2>{$lang('sound_mode')}</h2>
			<Select
				value={soundMode}
				placeholder={$lang('sound_mode') ?? 'Sound mode'}
				options={soundModeOptions}
				on:change={(event) => {
					if (event?.detail) call('select_sound_mode', { sound_mode: event.detail });
				}}
			/>
		{/if}

		<ConfigButtons />
	</Modal>
{/if}

<style>
	img {
		width: 100%;
		border-radius: 0.6rem;
		pointer-events: none;
		align-self: center;
		margin-top: 0.8rem;
		margin-bottom: 0.6rem;
		box-shadow:
			rgba(0, 0, 0, 0.3) 0px 19px 38px,
			rgba(0, 0, 0, 0.22) 0px 15px 12px;
	}

	.media-info {
		text-align: center;
		margin-bottom: 0.8rem;
	}

	.media-title {
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 0.2rem;
	}

	.media-subtitle {
		font-size: 0.9rem;
		opacity: 0.7;
	}

	.time-container {
		display: flex;
		justify-content: space-between;
		margin: 0.6rem 0 0.4rem;
		font-size: 0.85rem;
		font-weight: 500;
		opacity: 0.8;
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		margin: 1rem 0;
	}

	.volume-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.volume-slider {
		flex: 1;
	}

	.vol-buttons {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.spacer {
		width: 3rem;
		height: 3rem;
	}

	.icon-btn {
		width: 3.8rem;
		height: 3.8rem;
		color: inherit;
		border: none;
		cursor: pointer;
		background-color: unset;
		padding: 0;
		border-radius: 0.8rem;
		opacity: 0.6;
		transition: opacity 0.15s;
	}

	.icon-btn:hover {
		opacity: 1;
	}

	.icon-btn.main {
		width: 4.6rem;
		height: 4.6rem;
		opacity: 1;
	}

	.icon-btn.small {
		width: 3rem;
		height: 3rem;
	}

	.icon-btn.active {
		opacity: 1;
		color: var(--theme-navigate-selected-background-color, #5294e2);
	}

	.icon-btn.power-off {
		opacity: 0.5;
		color: #e25252;
	}

	.icon-btn.power-off:hover {
		opacity: 1;
	}
</style>
