<script lang="ts">
	import { dashboard, lang, record, ripple, states } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import PowerSummary from '$lib/Sidebar/PowerSummary.svelte';
	import Select from '$lib/Components/Select.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Ripple from 'svelte-ripple';
	import Icon from '@iconify/svelte';
	import { updateObj, generateId } from '$lib/Utils';
	import type { PowerSummaryItem, PowerSummaryGroup, PowerSummaryEntity } from '$lib/Types';

	export let isOpen: boolean;
	export let sel: PowerSummaryItem;

	// Ensure groups array exists and every group has an id for DnD
	if (!sel.groups) sel.groups = [];
	sel.groups = sel.groups.map((g) => (g.id ? g : { ...g, id: generateId($dashboard) }));

	let expandedIndex: number | null = sel.groups.length === 0 ? null : 0;

	
	function save() {
		$dashboard = $dashboard;
	}

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		save();
	}

	function setGroup(index: number, key: keyof PowerSummaryGroup, value: any) {
		if (!sel.groups) return;
		(sel.groups[index] as any)[key] = value;
		sel.groups = [...sel.groups];
		save();
	}

	function removeGroupProp(index: number, key: keyof PowerSummaryGroup) {
		if (!sel.groups) return;
		delete (sel.groups[index] as any)[key];
		sel.groups = [...sel.groups];
		save();
	}

	function addGroup() {
		const newGroup: PowerSummaryGroup = {
			id: generateId($dashboard),
			label: '',
			icon: 'mdi:circle',
			entities: []
		};
		sel.groups = [...(sel.groups ?? []), newGroup];
		expandedIndex = sel.groups.length - 1;
		save();
	}

	function removeGroup(index: number) {
		sel.groups = sel.groups?.filter((_, i) => i !== index);
		if (expandedIndex !== null && expandedIndex >= (sel.groups?.length ?? 0)) {
			expandedIndex = (sel.groups?.length ?? 1) - 1;
		}
		save();
	}

	function getAllEntityOptions() {
		return Object.entries($states)
			.sort(([, a], [, b]) => {
				const na = a?.attributes?.friendly_name ?? a?.entity_id ?? '';
				const nb = b?.attributes?.friendly_name ?? b?.entity_id ?? '';
				return na.localeCompare(nb);
			})
			.map(([id, entity]) => ({
				id,
				label: entity?.attributes?.friendly_name ?? id,
				hint: id
			}));
	}

	function getEntityOptionsForGroup(index: number) {
		const group = sel.groups?.[index];
		if (!group) return [];
		const existing = new Set(group.entities?.map((e) => e.entity_id) ?? []);
		return getAllEntityOptions().filter((opt) => !existing.has(opt.id));
	}

	function addEntity(index: number, entityId: string) {
		if (!sel.groups || !entityId) return;
		const group = sel.groups[index];
		const current = group.entities ?? [];
		if (!current.some((e) => e.entity_id === entityId)) {
			const newEntities: PowerSummaryEntity[] = [...current, { entity_id: entityId, on_state: 'on' }];
			setGroup(index, 'entities', newEntities);
		}
	}

	function removeEntity(index: number, entityId: string) {
		if (!sel.groups) return;
		const group = sel.groups[index];
		setGroup(
			index,
			'entities',
			(group.entities ?? []).filter((e) => e.entity_id !== entityId)
		);
	}

	function setEntityOnState(index: number, entityId: string, onState: string) {
		if (!sel.groups) return;
		const group = sel.groups[index];
		const updated = (group.entities ?? []).map((e) =>
			e.entity_id === entityId ? { ...e, on_state: onState || 'on' } : e
		);
		setGroup(index, 'entities', updated);
	}

	function setEntityName(index: number, entityId: string, name: string) {
		if (!sel.groups) return;
		const group = sel.groups[index];
		const updated = (group.entities ?? []).map((e) =>
			e.entity_id === entityId ? { ...e, name } : e
		);
		setGroup(index, 'entities', updated);
	}

	function handleDndConsider(event: CustomEvent) {
		sel.groups = event.detail.items;
	}

	function handleDndFinalize(event: CustomEvent) {
		sel.groups = event.detail.items.filter((item: any) => !item[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
		save();
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{$lang('power_summary')}</h1>

		<h2>{$lang('preview')}</h2>
		<div class="preview">
			<PowerSummary {sel} />
		</div>

		<h2>{$lang('options')}</h2>

		{#if sel.groups && sel.groups.length > 0}
			<div
				class="group-list"
				use:dndzone={{ items: sel.groups, flipDurationMs: 200, dropTargetStyle: {} }}
				on:consider={handleDndConsider}
				on:finalize={handleDndFinalize}
			>
				{#each sel.groups as group, i (group.id)}
					<div class="group-item" animate:flip={{ duration: 200 }}>
						<button
							class="group-header"
							class:expanded={expandedIndex === i}
							on:click={() => (expandedIndex = expandedIndex === i ? null : i)}
							use:Ripple={$ripple}
						>
							<span class="drag-handle">⠿</span>
							{#if group.icon}
								<Icon icon={group.icon} height="1em" width="1em" />
							{/if}
							<span class="group-name">{group.label || $lang('power_summary')}</span>
							<button
								class="remove-btn"
								on:click|stopPropagation={() => removeGroup(i)}
								aria-label="Remove group"
							>
								<Icon icon="mdi:close" height="1em" width="1em" />
							</button>
						</button>

						{#if expandedIndex === i}
							<div class="group-editor">
								<h2>{$lang('name')}</h2>
								<InputClear
									condition={group.label}
									on:clear={() => setGroup(i, 'label', '')}
									let:padding
								>
									<input
										class="input"
										type="text"
										bind:value={group.label}
										placeholder={$lang('power_summary')}
										on:change={() => setGroup(i, 'label', group.label)}
										style:padding
										autocomplete="off"
										spellcheck="false"
									/>
								</InputClear>

								<h2>{$lang('icon')}</h2>
								<div class="icon-gallery-container">
									<InputClear
										condition={group.icon}
										on:clear={() => setGroup(i, 'icon', '')}
										let:padding
									>
										<input
											class="input"
											type="text"
											bind:value={group.icon}
											placeholder="mdi:lightbulb"
											on:change={() => setGroup(i, 'icon', group.icon)}
											style:padding
											autocomplete="off"
											spellcheck="false"
										/>
									</InputClear>
									<button
										class="icon-gallery"
										title={$lang('icon')}
										on:click={() => window.open('https://icon-sets.iconify.design/', '_blank')}
										use:Ripple={$ripple}
									>
										<Icon icon="majesticons:open-line" height="none" />
									</button>
								</div>

								<h2>{$lang('entities')}</h2>
								<Select
									options={getEntityOptionsForGroup(i)}
									placeholder="{$lang('add')} {$lang('entity')}"
									value={undefined}
									on:change={(e) => addEntity(i, e.detail)}
								/>
								{#if (group.entities ?? []).length > 0}
									<div class="entity-tags">
										{#each group.entities ?? [] as entry}
											<div class="entity-tag">
												<div class="entity-tag-body">
													<div class="entity-fields">
														<div class="entity-name-row">
															<span class="entity-id" title={entry.entity_id}>
																{entry.entity_id.split('.')[1]}
															</span>
															<InputClear
																condition={entry.name}
																on:clear={() => setEntityName(i, entry.entity_id, '')}
																let:padding
															>
																<input
																	class="name-input"
																	type="text"
																	value={entry.name ?? ''}
																	placeholder="{$states[entry.entity_id]?.attributes?.friendly_name ?? '...'}"
																	on:change={(e) => setEntityName(i, entry.entity_id, e.currentTarget.value)}
																	on:blur={() => save()}
																	style:padding
																	autocomplete="off"
																	spellcheck="false"
																/>
															</InputClear>
														</div>
														<div class="entity-state-row">
															<span class="on-label">{$lang('on_states')}</span>
															<InputClear
																condition={entry.on_state}
																on:clear={() => setEntityOnState(i, entry.entity_id, 'on')}
																let:padding
															>
																<input
																	class="on-state-input"
																	type="text"
																	value={entry.on_state ?? 'on'}
																	placeholder="on"
																	on:change={(e) => setEntityOnState(i, entry.entity_id, e.currentTarget.value)}
																	on:blur={() => save()}
																	style:padding
																	autocomplete="off"
																	spellcheck="false"
																/>
															</InputClear>
														</div>
													</div>
												</div>
												<button
													class="entity-remove"
													on:click={() => removeEntity(i, entry.entity_id)}
													aria-label="Remove entity"
												>
													<Icon icon="mdi:close" height="0.8em" width="0.8em" />
												</button>
											</div>
										{/each}
									</div>
								{/if}
								{#if !(group.entities ?? []).length}
									<p class="hint">{$lang('add')} {$lang('entity')}</p>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<button class="add-group" on:click={addGroup} use:Ripple={$ripple}>
			<Icon icon="mdi:plus" height="1em" width="1em" />
			{$lang('add_group')}
		</button>

		<h2>{$lang('mobile')}</h2>
		<div class="button-container">
			<button
				class:selected={sel?.hide_mobile !== true}
				on:click={() => set('hide_mobile')}
				use:Ripple={$ripple}
			>
				{$lang('visible')}
			</button>
			<button
				class:selected={sel?.hide_mobile === true}
				on:click={() => set('hide_mobile', true)}
				use:Ripple={$ripple}
			>
				{$lang('hidden')}
			</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.preview {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.6rem;
		overflow: hidden;
	}

	.group-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		outline: none;
	}

	.group-item {
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.6rem;
		overflow: hidden;
	}

	.group-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 0.75rem;
		background: rgba(0, 0, 0, 0.2);
		border: none;
		color: inherit;
		font-family: inherit;
		font-size: inherit;
		cursor: pointer;
		text-align: left;
	}

	.group-header.expanded {
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.drag-handle {
		opacity: 0.3;
		cursor: grab;
		font-size: 1rem;
		flex-shrink: 0;
	}

	.group-name {
		flex: 1;
		font-size: 0.9rem;
	}

	.remove-btn {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		padding: 0.2rem;
		opacity: 0.5;
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.remove-btn:hover {
		opacity: 1;
	}

	.group-editor {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.add-group {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: rgba(255, 255, 255, 0.06);
		border: 1px dashed rgba(255, 255, 255, 0.2);
		border-radius: 0.6rem;
		padding: 0.5rem 0.75rem;
		color: inherit;
		font-family: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		width: 100%;
		margin-top: 0.4rem;
	}

	.add-group:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.hint {
		font-size: 0.8rem;
		opacity: 0.45;
		margin: 0;
	}

	.icon-gallery-container :global(.clear) {
		flex: 1;
	}

	.entity-tags {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-top: 0.4rem;
	}

	.entity-tag {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.5rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}

	.entity-tag-body {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		min-width: 0;
	}

	.entity-fields {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.entity-name-row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.entity-id {
		flex-shrink: 0;
		font-size: 0.7rem;
		opacity: 0.5;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 0.25rem;
		padding: 0.1rem 0.3rem;
	}

	.entity-state-row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.on-label {
		flex-shrink: 0;
		font-size: 0.68rem;
		opacity: 0.45;
	}

	.name-input {
		flex: 1;
		min-width: 60px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 0.35rem;
		padding: 0.15rem 0.4rem;
		color: inherit;
		font-family: inherit;
		font-size: 0.78rem;
	}

	.on-state-input {
		flex: 1;
		min-width: 40px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 0.35rem;
		padding: 0.15rem 0.4rem;
		color: inherit;
		font-family: inherit;
		font-size: 0.78rem;
	}

	.entity-remove {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		padding: 0.1rem;
		opacity: 0.5;
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.entity-remove:hover {
		opacity: 1;
	}
</style>
