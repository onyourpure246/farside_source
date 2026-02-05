// ============================================================================
// SYSTEM: SHARED / GENERIC
// ============================================================================
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
}

// ============================================================================
// COMMONS: AUTH & USERS
// ============================================================================
export interface CommonUser {
	id: number;
	username: string;
	password: string; // bcrypt hashed
	displayname: string | null;
	firstname: string | null;
	lastname: string | null;
	jobtitle: string | null;
	isadmin: number;
	created_at: string;
	updated_at: string;
}

// Safe user type (without password) for API responses
export interface SafeUser {
	id: number;
	username: string;
	displayname: string | null;
	firstname: string | null;
	lastname: string | null;
	jobtitle: string | null;
	isadmin: number;
	created_at: string;
	updated_at: string;
}

// Request DTOs - Users
export interface CreateUserRequest {
	username: string;
	password: string;
	displayname?: string;
	firstname?: string;
	lastname?: string;
	jobtitle?: string;
	isadmin?: number;
}

export interface UpdateUserRequest {
	password?: string;
	displayname?: string;
	firstname?: string;
	lastname?: string;
	jobtitle?: string;
	isadmin?: number;
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	success: boolean;
	token?: string;
	user?: SafeUser;
	message?: string;
}

// ============================================================================
// COMMONS: PARTICIPANTS
// ============================================================================
export interface CommonParticipant {
	id: number;
	codename: string;
	name: string | null;
	user_id: number | null;
	isactive: number;
	created_by: string | null;
	created_at: string;
	updated_by: string | null;
	updated_at: string;
}

// Request DTOs - Participants
export interface CreateParticipantRequest {
	codename: string;
	name?: string;
	user_id?: number | null;
}

export interface UpdateParticipantRequest {
	codename?: string;
	name?: string;
	user_id?: number | null;
	isactive?: number;
}

// ============================================================================
// COMMONS: TAGS
// ============================================================================
export interface CommonTag {
	id: number;
	name: string;
	colour: string;
	icon: string | null;
	isactive: number;
	created_by: number | null;
	created_at: string;
	updated_by: number | null;
	updated_at: string;
}

// Request DTOs - Tags
export interface CreateTagRequest {
	name: string;
	colour: string;
	icon?: string;
}

export interface UpdateTagRequest {
	name?: string;
	colour?: string;
	icon?: string;
	isactive?: number;
}

// ============================================================================
// FEATURE: NEWS / ANNOUNCEMENTS
// ============================================================================
export interface NewsItem {
	id: number;
	title: string;
	content: string | null;
	category: string | null;
	cover_image: string | null;
	status: 'draft' | 'published' | 'archived';
	publish_date: string; // MySQL datetime string
	view_count: number;
	isactive: number;
	created_by: string | null;
	created_at: string;
	updated_by: string | null;
	updated_at: string;
}

// Request DTOs - News
export interface CreateNewsRequest {
	title: string;
	content?: string;
	category?: string;
	cover_image?: string; // UUID of uploaded file
	status?: 'draft' | 'published' | 'archived';
	publish_date?: string;
}

export interface UpdateNewsRequest {
	title?: string;
	content?: string;
	category?: string;
	cover_image?: string;
	status?: 'draft' | 'published' | 'archived';
	publish_date?: string;
	isactive?: number;
}

// ============================================================================
// FEATURE: DOWNLOAD SYSTEM (DL)
// ============================================================================
// GET https://casdu-backops.witspleasure.com/api/fy2569/dl/folder/:id
export interface DLFolder {
	id: number;
	abbr: string;
	name: string | null;
	description: string | null;
	parent: number | null;
	mui_icon: string | null;
	mui_colour: string | null;
	isactive: number;
	created_by: number | null;
	created_at: string;
	updated_by: number | null;
	updated_at: string;
}

// GET https://casdu-backops.witspleasure.com/api/fy2569/dl/file/:id
export interface DLFile {
	id: number;
	parent: number | null;
	name: string;
	description: string | null;
	filename: string;
	sysname: string;
	mui_icon: string | null;
	mui_colour: string | null;
	isactive: number;
	created_by: number | null;
	created_at: string;
	updated_by: number | null;
	updated_at: string;
}

export interface FolderContentResponse {
	folders: DLFolder[];
	files: DLFile[];
}

// Request/Response DTOs - Download
export interface CreateFolderRequest {
	abbr: string;
	name?: string;
	description?: string;
	parent?: number | null;
	mui_icon?: string;
	mui_colour?: string;
	isactive?: number;
}

export interface UpdateFolderRequest {
	abbr?: string;
	name?: string;
	description?: string;
	parent?: number | null;
	mui_icon?: string;
	mui_colour?: string;
	isactive?: number;
}

export interface CreateFileRequest {
	parent?: number | null;
	name: string;
	description?: string;
	filename: string;
	sysname: string;
	mui_icon?: string;
	mui_colour?: string;
	isactive?: number;
}

export interface UpdateFileRequest {
	parent?: number | null;
	name?: string;
	description?: string;
	filename?: string;
	mui_icon?: string;
	mui_colour?: string;
	isactive?: number;
}

// File Upload Request (for multipart/form-data)
export interface UploadFileRequest {
	parent?: number | null;
	name: string;
	description?: string;
	file: File; // The actual file to upload
	isactive?: number;
}

// ============================================================================
// FEATURE: PLANNER SYSTEM
// ============================================================================

// --- Projects ---
export interface PlannerProject {
	id: number;
	shortname: string;
	name: string | null;
	description: string | null;
	displayorder: number;
	manager_participant_id: number | null;
	isactive: number;
	created_by: string | null;
	created_at: string;
	updated_by: string | null;
	updated_at: string;
}

export interface CreateProjectRequest {
	shortname: string;
	name?: string;
	description?: string;
	displayorder?: number;
	manager_participant_id?: number | null;
}

export interface UpdateProjectRequest {
	shortname?: string;
	name?: string;
	description?: string;
	displayorder?: number;
	manager_participant_id?: number | null;
	isactive?: number;
}

// --- Tasks ---
export interface PlannerTask {
	id: number;
	project_id: number;
	name: string | null;
	description: string | null;
	displayorder: number;
	planned_start_date: string | null;
	planned_end_date: string | null;
	actual_start_date: string | null;
	actual_end_date: string | null;
	isactive: number;
	created_by: string | null;
	created_at: string;
	updated_by: string | null;
	updated_at: string;
}

export interface CreateTaskRequest {
	project_id: number;
	name?: string;
	description?: string;
	displayorder?: number;
	planned_start_date?: string | null;
	planned_end_date?: string | null;
}

export interface UpdateTaskRequest {
	project_id?: number;
	name?: string;
	description?: string;
	displayorder?: number;
	planned_start_date?: string | null;
	planned_end_date?: string | null;
	actual_start_date?: string | null;
	actual_end_date?: string | null;
	isactive?: number;
}

// --- Task Participants (Assignments) ---
export interface PlannerTaskParticipant {
	id: number;
	task_id: number;
	participant_id: number;
	isactive: number;
	created_by: string | null;
	created_at: string;
	updated_by: string | null;
	updated_at: string;
}

export interface CreateTaskParticipantRequest {
	task_id: number;
	participant_id: number;
}

export interface UpdateTaskParticipantRequest {
	isactive?: number;
}

// --- Task Tags (Mappings) ---
export interface PlannerTaskTag {
	task_id: number;
	tag_id: number;
}

export interface CreateTaskTagRequest {
	task_id: number;
	tag_id: number;
}
