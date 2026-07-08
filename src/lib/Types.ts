import type Konva from 'konva';
import type { ShapeConfig } from 'konva/lib/Shape';

// configuration.yaml

export interface ProfileConfig {
	id: string;
	label: string;
}

export interface Configuration {
	hassUrl?: string;
	locale?: string;
	custom_js?: boolean;
	custom_css?: boolean;
	motion?: boolean;
	addons?: Addons;
	token?: string;
	profiles?: ProfileConfig[];
}

export interface Addons {
	youtube?: boolean;
	maptiler?: {
		apikey: string;
	};
	music_assistant?: {
		server_url: string;
		token: string;
		username?: string;
	};
}

export interface Dashboard {
	views: Views[];
	sidebar: SidebarItem[];
	theme?: string;
	hide_views?: boolean;
	hide_sidebar?: boolean;
	sidebarWidth?: number;
}

export interface Views {
	id?: number;
	name?: string;
	icon?: string;
	sections?: Section[];
	isDndShadowItem?: boolean;
	is_default?: boolean;
	default_timeout?: number;
	iframe_url?: string;
}

export interface Section {
	id?: number;
	name?: string;
	items?: Item[];
	spacer?: boolean;
	visibility?: {
		conditions?: Condition[];
	}[];
	item_visibility_template?: {
		conditions?: Condition[];
	}[];

	// HorizontalStack
	type?: string;
	sections?: Section[];
}

export interface Condition {
	condition?: 'state' | 'numeric_state' | 'screen' | 'time' | 'or' | 'and';
	conditions?: Condition[];
	id?: number;
	entity?: string;
	state?: string;
	state_not?: string;
	media_query?: string;
	above?: number;
	below?: number;
	after?: string;
	before?: string;
	collapsed?: boolean;
}

export interface Translations {
	[key: string]: string;
}

// dashboard.yaml

export interface ViewItem {
	id?: number;
	name?: string;
	icon?: string;
	sections?: any[];
	is_default?: boolean;
	default_timeout?: number;
	iframe_url?: string;
}

export interface EmptyItem {
	id?: number;
}

export interface ButtonItem {
	type: string;
	id: number;
	entity_id: string;
	name?: string;
	icon?: string;
	color?: string;
	marquee?: boolean;
	more_info?: boolean;
	display_only?: boolean;
	show_timer?: boolean;
	confirm?: boolean;
	service?: string;
	state: any;
	visibility?: {
		conditions?: Condition[];
	}[];
	template?: {
		[key: string]: {
			set_state?: string;
			state?: string;
			name?: string;
			icon?: string;
			color?: string;
			service?: string;
		};
	};
}

export interface Template {
	[id: number]: {
		[key: string]: {
			input: string | undefined;
			output: string | undefined;
			error: string | undefined;
			entity_id: string | undefined;
		};
	};
}

export interface PersistentNotification {
	created_at: string;
	message: string;
	notification_id: string;
	title: string;
	status: 'read' | 'unread';
}

export type SidebarItem = BarItem &
	BinarySensorItem &
	CameraItem &
	DateItem &
	GraphItem &
	HistoryItem &
	IframeItem &
	ImageItem &
	NavigateItem &
	RadialItem &
	SensorItem &
	TemplateItem &
	TimeItem &
	WeatherItem &
	WeatherForecastItem &
	DividerItem &
	AiAssistantItem &
	PowerSummaryItem;

export interface BinarySensorItem {
	type?: string;
	id?: number;
	entity_id?: string;
	name?: string;
	prefix?: string;
	suffix?: string;
	on_value?: string;
	off_value?: string;
	icon_on?: string;
	icon_off?: string;
	color_on?: string;
	color_off?: string;
	hide_mobile?: boolean;
}

export interface PowerSummaryGroup {
	id?: number;
	label?: string;
	icon?: string;
	domains?: string[];
	exclude?: string[];
	on_states?: string[];
	entities?: PowerSummaryEntity[];
}

export interface PowerSummaryEntity {
	entity_id: string;
	on_state?: string;
	name?: string;
}

export interface PowerSummaryItem {
	type?: string;
	id?: number;
	groups?: PowerSummaryGroup[];
	hide_mobile?: boolean;
}

export interface AiAssistantItem {
	type?: string;
	id?: number;
	name?: string;
	icon?: string;
	agent_id?: string;
	wake_word?: string;
	hide_mobile?: boolean;
	tts_enabled?: boolean;
	tts_voice?: string;
}

export interface AiMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}

export interface BarItem {
	type?: string;
	id?: number;
	entity_id?: string;
	name?: string;
	math?: string;
	hide_mobile?: boolean;
}

export interface CameraItem {
	type?: string;
	id?: number;
	entity_id?: string;
	stream?: boolean;
	size?: string;
	hide_mobile?: boolean;
}

export interface DateItem {
	type?: string;
	id?: number;
	short_day?: boolean;
	short_month?: boolean;
	hide?: string;
	layout?: string;
	hide_mobile?: boolean;
}

export interface GraphItem {
	name?: string;
	type?: string;
	id?: number;
	entity_id?: string;
	period?: string;
	stroke?: number;
	hide_mobile?: boolean;
	duration?: string;
	start_time?: string;
	end_time?: string;
}

export interface HistoryItem {
	type?: string;
	id?: number;
	entity_id?: string;
	period?: string;
	hide_mobile?: boolean;
}

export interface IframeItem {
	type?: string;
	id?: number;
	url?: string;
	size?: string;
	hide_mobile?: boolean;
}

export interface ImageItem {
	type?: string;
	id?: number;
	entity_id?: string;
	url?: string;
	hide_mobile?: boolean;
}

export interface DividerItem {
	type?: string;
	id?: number;
	mode?: string;
	size?: number;
	hide_mobile?: boolean;
}

export interface NavigateItem {
	type?: string;
	id?: number;
	hide_mobile?: boolean;
}

export interface RadialItem {
	type?: string;
	id?: number;
	entity_id?: string;
	name?: string;
	stroke?: number;
	hide_mobile?: boolean;
}

export interface SensorItem {
	type?: string;
	id?: number;
	entity_id?: string;
	prefix?: string;
	suffix?: string;
	date?: boolean;
	hide_mobile?: boolean;
}

export interface TemplateItem {
	type?: string;
	id?: number;
	template?: string;
	icon?: string;
	icon_size?: string;
	icon_color?: string;
	hide_mobile?: boolean;
}

export interface TimeItem {
	type?: string;
	id?: number;
	hour12?: boolean;
	seconds?: boolean;
	hide_mobile?: boolean;
}

export interface TimerItem {
	type?: string;
	id?: number;
	entity_id?: string;
	hide_mobile?: boolean;
}

export interface WeatherItem {
	type?: string;
	id?: number;
	entity_id?: string;
	state?: string;
	icon_pack?: string;
	sensor?: string;
	icon?: string;
	show_apparent?: boolean;
	hide_mobile?: boolean;
}

export interface WeatherForecastItem {
	type?: string;
	id?: number;
	entity_id?: string;
	state?: string;
	icon_pack?: string;
	days_to_show?: number;
	hide_mobile?: boolean;
}

export interface YouTubeEvent {
	message: 'auth-pending' | 'auth' | 'update-credentials' | 'auth-error' | 'error';
	verification_url?: string;
	user_code?: string;
	timestamp?: number;
	error?: any;
}

export type KonvaMode = 'default' | 'pan' | 'zoom';

export interface KonvaImageCache {
	[selId: string]: {
		[id: string]: HTMLImageElement;
	};
}

export interface KonvaHistory {
	elements: Konva.Node[];
	selectedShapes: string[];
}

export interface KonvaStore {
	children: Konva.Node[];
	selectedShapes: ShapeConfig[];
	mode: KonvaMode;
	undoStack: KonvaHistory[];
	redoStack: KonvaHistory[];
}

export type ModalRowType = 'camera' | 'buttons' | 'sensor' | 'slider';

/** A single button inside a RowButtons */
export interface ModalButtonItem {
	id: number;
	entity_id?: string;
	name?: string;
	icon?: string;
	service?: string; // optional override, defaults to togglable service
}

/** Base fields shared by every row */
interface ModalRowBase {
	id: number;
	type: ModalRowType;
}

export interface ModalRowCamera extends ModalRowBase {
	type: 'camera';
	entity_id?: string;
	stream?: boolean;
}

export interface ModalRowButtons extends ModalRowBase {
	type: 'buttons';
	columns?: number; // 1–4, defaults to 2
	items?: ModalButtonItem[];
}

export interface ModalRowSensor extends ModalRowBase {
	type: 'sensor';
	entity_id?: string;
	name?: string;
	prefix?: string;
	suffix?: string;
}

export interface ModalRowSlider extends ModalRowBase {
	type: 'slider';
	entity_id?: string;
	name?: string;
}

export type ModalRow = ModalRowCamera | ModalRowButtons | ModalRowSensor | ModalRowSlider;

/** The top-level dashboard item */
export interface CustomPanelItem {
	type: 'custom_panel';
	id: number;
	name?: string;
	icon?: string;
	color?: string;
	rows?: ModalRow[];
	primary_row_id?: number;
}

export interface DoorbellItem {
	type: 'doorbell';
	id: number;
	name?: string;
	camera_entity?: string;
	action_entity?: string;
	trigger_entity?: string;
	trigger_timeout?: number;
	stream?: boolean;
}

export interface MusicAssistantItem {
	type: 'music_assistant';
	id: number;
	name?: string;
	icon?: string;
	player_id?: string;
}

export interface IframeGridItem {
	type: 'iframe';
	id: number;
	name?: string;
	icon?: string;
	url?: string;
}

export interface RemoteButton {
	id: number;
	name?: string;
	icon?: string;
	entity_id?: string;
	command?: string;
	device?: string;
}

export interface RemoteItem {
	type: 'remote';
	id: number;
	name?: string;
	icon?: string;
	buttons?: RemoteButton[];
}
