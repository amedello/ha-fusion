<script lang="ts">
	import { editMode, itemHeight, states, lang, dashboard } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import Icon, { loadIcon } from '@iconify/svelte';
	import type { CustomPanelItem } from '$lib/Types';

	export let sel: CustomPanelItem;

	// legge live dal $dashboard così le modifiche nella modale si riflettono subito
	function findItem(sections: any[]): CustomPanelItem | undefined {
		for (const section of sections ?? []) {
			const found = section?.items?.find((i: any) => i.id === sel.id);
			if (found) return found as CustomPanelItem;
			// horizontal-stack ha sezioni annidate
			if (section?.sections) {
				const nested = findItem(section.sections);
				if (nested) return nested;
			}
		}
		return undefined;
	}

	$: item = (() => {
		// dipende esplicitamente da $dashboard per triggare reattività
		const _ = $dashboard;
		for (const view of $dashboard?.views ?? []) {
			const found = findItem(view?.sections ?? []);
			if (found) return found;
		}
		return sel;
	})();

	$: name     = item?.name  || $lang('section') || 'Panel';
	$: tileIcon = item?.icon  || 'mdi:view-dashboard-edit';
	$: color    = item?.color || 'rgba(0,0,0,0.3)';
	$: rowCount = item?.rows?.length ?? 0;

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/CustomPanelConfig.svelte'), { sel });
		} else {
			openModal(() => import('$lib/Modal/CustomPanelModal.svelte'), { sel });
		}
	}
</script>

<button
	style:height="{$itemHeight}px"
	style:background-color={color}
	on:click={handleClick}
>
	<div class="icon">
		{#await loadIcon(tileIcon)}
			<Icon icon="ph:dot" style="font-size: 1.6rem" />
		{:then resolvedIcon}
			<Icon icon={resolvedIcon} style="font-size: 1.6rem" />
		{:catch}
			<Icon icon="mdi:view-dashboard-edit" style="font-size: 1.6rem" />
		{/await}
	</div>

	<div class="label">
		<span class="name">{name}</span>
		{#if rowCount > 0}
			<span class="count">{rowCount} {rowCount === 1 ? $lang('row') || 'row' : $lang('rows') || 'rows'}</span>
		{/if}
	</div>
</button>

<style>
	button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		border: none;
		border-radius: 0.65rem;
		cursor: pointer;
		padding: 0 1rem;
		color: white;
		font-family: inherit;
		font-size: 0.95rem;
		transition: filter 150ms ease;
		overflow: hidden;
	}

	button:hover {
		filter: brightness(1.15);
	}

	button:active {
		filter: brightness(0.9);
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.6rem;
		flex-shrink: 0;
		width: 2.4rem;
		height: 2.4rem;
		background-color: rgba(0, 0, 0, 0.25);
		border-radius: 50%;
		padding: 0.5rem;
	}

	.label {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 0;
		gap: 0.1rem;
	}

	.name {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.count {
		font-size: 0.75rem;
		opacity: 0.55;
	}
</style>
