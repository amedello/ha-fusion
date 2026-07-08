<script lang="ts">
	import { states, editMode, motion, lang } from '$lib/Stores';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import type { PowerSummaryItem, PowerSummaryGroup, PowerSummaryEntity } from '$lib/Types';

	export let sel: PowerSummaryItem | undefined = undefined;
	export let demo = false;

	interface GroupResult {
		group: PowerSummaryGroup;
		count: number;
		displayText: string;
	}

	// Demo data shown in the config modal preview
	const demoResults: GroupResult[] = [
		{
			group: { label: 'Lights', icon: 'mdi:lightbulb' } as any,
			count: 3,
			displayText: ''
		},
		{
			group: { label: 'Devices', icon: 'mdi:television' } as any,
			count: 0,
			displayText: ''
		}
	];

	$: results = demo ? demoResults : computeGroups(sel?.groups ?? [], $states);

	function computeGroups(
		groups: PowerSummaryGroup[],
		currentStates: typeof $states
	): GroupResult[] {
		return groups.map((group) => {
			// Entity-based matching: count entities whose state matches their on_state
			const entries = group.entities ?? [];
			const entityMap = new Map(entries.map((e: PowerSummaryEntity) => [e.entity_id, e]));
			const active = Object.entries(currentStates ?? {})
				.filter(([id, entity]) => {
					const entry = entityMap.get(id);
					if (!entry) return false;
					const onState = entry.on_state ?? 'on';
					return entity.state === onState;
				})
				.map(([, entity]) => entity);

			const count = active.length;
			let displayText = '';
			if (count === 1) {
				const entry = entityMap.get(active[0].entity_id);
				displayText = entry?.name || getName(undefined, active[0]) || active[0].entity_id.split('.')[1];
			}

			return { group, count, displayText };
		});
	}
</script>

{#if sel?.groups?.length || demo || $editMode}
	<div
		class="container"
		style:padding="var(--theme-sidebar-item-padding)"
		style:display="flex"
		style:flex-direction="column"
		style:gap="0.4rem"
	>
		{#each results as { group, count, displayText }}
			<div
				class="group-row"
				style:opacity={count === 0 && !$editMode ? '0.3' : '1'}
				style:transition="opacity {$motion}ms ease"
			>
				<span class="group-icon">
					<Icon icon={group.icon || 'mdi:circle-small'} height="1em" width="1em" />
				</span>

				<div class="group-body">
					{#if group.label}
						<span class="group-label">{group.label}</span>
					{/if}
					{#if displayText}
						<span class="group-text">{displayText}</span>
					{/if}
				</div>

				{#if count > 0 || $editMode}
					<span class="badge" class:badge-zero={count === 0}>{count}</span>
				{/if}
			</div>
		{/each}

		{#if $editMode && (!sel?.groups || sel.groups.length === 0)}
			<span class="placeholder">{$lang('power_summary')}</span>
		{/if}
	</div>
{/if}

<style>
	.container {
		pointer-events: none;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
	}

	.group-row {
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.6rem;
		padding: 0.5rem 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.group-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		font-size: 1.2rem;
		width: 1.2rem;
		color: rgba(255, 255, 255, 0.75);
	}

	.group-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.group-label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.group-text {
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.badge {
		flex-shrink: 0;
		background: var(--theme-colors-sidebar-item-background, rgba(255, 255, 255, 0.15));
		border-radius: 999px;
		padding: 0 0.5rem;
		font-size: 0.75rem;
		font-weight: 700;
		min-width: 1.4rem;
		text-align: center;
		color: var(--theme-colors-sidebar-font-color, inherit);
	}

	.badge-zero {
		opacity: 0.4;
	}

	.placeholder {
		color: rgba(255, 255, 255, 0.25);
		font-size: 0.9rem;
		padding: 0.5rem 0.75rem;
	}
</style>
