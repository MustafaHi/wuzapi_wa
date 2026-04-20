/**
 * WuzAPI - WhatsApp API Client
 * Node.js implementation using native fetch
 */

interface RequestOptions {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  headers?: Record<string, string>;
  body?: string;
}

interface ApiResponse<T = any> {
  code: number;
  data?: T;
  success: boolean;
}

interface WebhookConfig {
  webhookURL: string;
}

interface UserListResponse {
  id: number;
  name: string;
  token: string;
  webhook: string;
  jid: string;
  qrcode: string;
  connected: boolean;
  expiration: number;
  events: string;
}

interface ProxyConfig {
  enabled: boolean;
  proxyURL: string;
}

interface S3Config {
  enabled: boolean;
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  pathStyle: boolean;
  publicURL: string;
  mediaDelivery: 'base64' | 's3' | 'both';
  retentionDays: number;
}

interface UserCreatePayload {
  name: string;
  token: string;
  webhook?: string;
  events?: string;
  proxyConfig?: ProxyConfig;
  s3Config?: S3Config;
}

interface PhoneInfo {
  Phone: string[];
}

interface UserCheckPayload {
  Phone: string[];
}

interface UserCheckResponse {
  IsInWhatsapp: boolean;
  JID: string;
  Query: string;
  VerifiedName: string;
}

interface ContactsResponse {
  [key: string]: {
    BusinessName: string;
    FirstName: string;
    Found: boolean;
    FullName: string;
    PushName: string;
  };
}

interface ContextInfo {
  StanzaId?: string;
  Participant?: string;
}

interface TextMessagePayload {
  Phone: string;
  Body: string;
  Id?: string;
  LinkPreview?: boolean;
  ContextInfo?: ContextInfo;
}

interface TemplateButton {
  DisplayText: string;
  Type: string;
  URL?: string;
}

interface TemplateMessagePayload {
  Phone: string;
  Content: string;
  Footer?: string;
  Buttons?: TemplateButton[];
}

interface MediaMessagePayload {
  Phone: string;
  Caption?: string;
}

interface AudioMessagePayload extends MediaMessagePayload {
  Audio: string;
}

interface ImageMessagePayload extends MediaMessagePayload {
  Image: string;
}

interface DocumentMessagePayload extends MediaMessagePayload {
  FileName: string;
  Document: string;
}

interface VideoMessagePayload extends MediaMessagePayload {
  Video: string;
  JpegThumbnail?: string;
}

interface StickerMetadata {
  PackId?: string;
  PackName?: string;
  PackPublisher?: string;
  Emojis?: string[];
  PngThumbnail?: string;
}

interface StickerMessagePayload extends MediaMessagePayload, StickerMetadata {
  Sticker: string;
}

interface LocationMessagePayload {
  Phone: string;
  Latitude: number;
  Longitude: number;
  Name?: string;
}

interface ContactMessagePayload {
  Phone: string;
  Name: string;
  Vcard: string;
}

interface PresencePayload {
  Phone: string;
  State: 'composing' | 'paused';
  Media?: string;
}

interface MarkReadPayload {
  Id: string[];
  ChatPhone?: string;
  SenderPhone?: string;
  Chat?: string;
  Sender?: string;
}

interface ReactPayload {
  Phone: string;
  Body: string;
  Id: string;
}

interface DownloadMediaPayload {
  Url: string;
  MediaKey: string;
  Mimetype: string;
  FileSHA256: string;
  FileLength: number;
}

interface GroupListResponse {
  Groups: GroupInfo[];
}

interface Participant {
  IsAdmin: boolean;
  IsSuperAdmin: boolean;
  JID: string;
}

interface GroupInfo {
  AnnounceVersionID: string;
  DisappearingTimer: number;
  GroupCreated: string;
  IsAnnounce: boolean;
  IsEphemeral: boolean;
  IsLocked: boolean;
  JID: string;
  Name: string;
  NameSetAt: string;
  NameSetBy: string;
  OwnerJID: string;
  ParticipantVersionID: string;
  Participants: Participant[];
  Topic: string;
  TopicID: string;
  TopicSetAt: string;
  TopicSetBy: string;
}

interface GroupInviteLinkPayload {
  GroupJID: string;
}

interface GroupInfoPayload {
  GroupJID: string;
}

interface GroupPhotoPayload {
  GroupJID: string;
  Image: string;
}

interface GroupNamePayload {
  GroupJID: string;
  Name: string;
}

interface CreateGroupPayload {
  name: string;
  participants: string[];
}

interface GroupLockedPayload {
  groupjid: string;
  locked: boolean;
}

interface GroupEphemeralPayload {
  groupjid: string;
  duration: '24h' | '7d' | '90d' | 'off';
}

interface GroupPhotoRemovePayload {
  groupjid: string;
}

interface ConnectPayload {
  Subscribe?: string[];
  Immediate?: boolean;
}

interface MessageResponse {
  code: number;
  data: {
    Details: string;
    Id?: string;
    Timestamp?: string;
  };
  success: boolean;
}

class WuzAPIClient {
  private baseURL: string;
  private userToken?: string;
  private adminToken?: string;

  constructor(baseURL: string, options?: { userToken?: string; adminToken?: string }) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.userToken = options?.userToken;
    this.adminToken = options?.adminToken;
  }

  /**
   * Generic request method
   */
  private async request<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' | 'PUT' = 'GET',
    payload?: any,
    token?: string
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = token;
    } else if (this.userToken) {
      headers['Token'] = this.userToken;
    }

    const options: RequestOptions = {
      method,
      headers,
    };

    if (payload) {
      options.body = JSON.stringify(payload);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      throw new Error(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================
  // ADMIN ENDPOINTS (User Management)
  // ============================================

  /**
   * List all registered users
   * GET /admin/users
   */
  async listUsers(): Promise<UserListResponse[]> {
    const response = await this.request<ApiResponse<UserListResponse[]>>(
      '/admin/users',
      'GET',
      undefined,
      this.adminToken
    );
    return response.data || [];
  }

  /**
   * Add a new user
   * POST /admin/users
   */
  async addUser(payload: UserCreatePayload): Promise<{ id: number }> {
    const response = await this.request<ApiResponse<{ id: number }>>(
      '/admin/users',
      'POST',
      payload,
      this.adminToken
    );
    return response.data || { id: 0 };
  }

  /**
   * Delete a user by ID
   * DELETE /admin/users/{id}
   */
  async deleteUser(userId: number): Promise<{ Details: string }> {
    const response = await this.request<ApiResponse<{ Details: string }>>(
      `/admin/users/${userId}`,
      'DELETE',
      undefined,
      this.adminToken
    );
    return response.data || { Details: '' };
  }

  // ============================================
  // WEBHOOK ENDPOINTS
  // ============================================

  /**
   * Configure webhook
   * POST /webhook
   */
  async setWebhook(webhookURL: string): Promise<{ webhook: string }> {
    const response = await this.request<ApiResponse<{ webhook: string }>>(
      '/webhook',
      'POST',
      { webhookURL }
    );
    return response.data || { webhook: '' };
  }

  /**
   * Get configured webhook
   * GET /webhook
   */
  async getWebhook(): Promise<{ subscribe: string[]; webhook: string }> {
    const response = await this.request<ApiResponse<{ subscribe: string[]; webhook: string }>>(
      '/webhook',
      'GET'
    );
    return response.data || { subscribe: [], webhook: '' };
  }

  // ============================================
  // HMAC CONFIGURATION
  // ============================================

  /**
   * Configure HMAC key
   * POST /session/hmac/config
   */
  async configureHMAC(hmacKey: string): Promise<{ Details: string }> {
    const response = await this.request<ApiResponse<{ Details: string }>>(
      '/session/hmac/config',
      'POST',
      { hmac_key: hmacKey }
    );
    return response.data || { Details: '' };
  }

  /**
   * Get HMAC configuration status
   * GET /session/hmac/config
   */
  async getHMACConfig(): Promise<{ hmac_key: string }> {
    const response = await this.request<ApiResponse<{ hmac_key: string }>>(
      '/session/hmac/config',
      'GET'
    );
    return response.data || { hmac_key: '' };
  }

  /**
   * Delete HMAC configuration
   * DELETE /session/hmac/config
   */
  async deleteHMACConfig(): Promise<{ Details: string }> {
    const response = await this.request<ApiResponse<{ Details: string }>>(
      '/session/hmac/config',
      'DELETE'
    );
    return response.data || { Details: '' };
  }

  // ============================================
  // SESSION ENDPOINTS
  // ============================================

  /**
   * Connect to WhatsApp servers
   * POST /session/connect
   */
  async connect(subscribe?: string[], immediate?: boolean): Promise<any> {
    const payload: ConnectPayload = {};
    if (subscribe) payload.Subscribe = subscribe;
    if (immediate !== undefined) payload.Immediate = immediate;

    const response = await this.request<ApiResponse>(
      '/session/connect',
      'POST',
      payload
    );
    return response.data || {};
  }

  /**
   * Disconnect from WhatsApp servers (keeps session)
   * POST /session/disconnect
   */
  async disconnect(): Promise<{ Details: string }> {
    const response = await this.request<ApiResponse<{ Details: string }>>(
      '/session/disconnect',
      'POST'
    );
    return response.data || { Details: '' };
  }

  /**
   * Logout (closes session, requires QR scan next time)
   * POST /session/logout
   */
  async logout(): Promise<{ Details: string }> {
    const response = await this.request<ApiResponse<{ Details: string }>>(
      '/session/logout',
      'POST'
    );
    return response.data || { Details: '' };
  }

  /**
   * Get session status
   * GET /session/status
   */
  async getStatus(): Promise<{ Connected: boolean; LoggedIn: boolean }> {
    const response = await this.request<ApiResponse<{ Connected: boolean; LoggedIn: boolean }>>(
      '/session/status',
      'GET'
    );
    return response.data || { Connected: false, LoggedIn: false };
  }

  /**
   * Get QR code
   * GET /session/qr
   */
  async getQRCode(): Promise<{ QRCode: string }> {
    const response = await this.request<ApiResponse<{ QRCode: string }>>(
      '/session/qr',
      'GET'
    );
    return response.data || { QRCode: '' };
  }

  // ============================================
  // USER ENDPOINTS
  // ============================================

  /**
   * Get user details
   * POST /user/info
   */
  async getUserInfo(phones: string[]): Promise<any> {
    const response = await this.request<ApiResponse>(
      '/user/info',
      'POST',
      { Phone: phones }
    );
    return response.data || {};
  }

  /**
   * Check if phone numbers are registered on WhatsApp
   * POST /user/check
   */
  async checkUsers(phones: string[]): Promise<{ Users: UserCheckResponse[] }> {
    const response = await this.request<ApiResponse<{ Users: UserCheckResponse[] }>>(
      '/user/check',
      'POST',
      { Phone: phones }
    );
    return response.data || { Users: [] };
  }

  /**
   * Get user avatar
   * GET /user/avatar
   */
  async getAvatar(phone: string, preview: boolean = true): Promise<any> {
    const response = await this.request<any>(
      `/user/avatar?Phone=${phone}&Preview=${preview}`,
      'GET'
    );
    return response;
  }

  /**
   * Get all contacts
   * GET /user/contacts
   */
  async getContacts(): Promise<ContactsResponse> {
    const response = await this.request<ApiResponse<ContactsResponse>>(
      '/user/contacts',
      'GET'
    );
    return response.data || {};
  }

  // ============================================
  // CHAT ENDPOINTS - SEND MESSAGES
  // ============================================

  /**
   * Send text message
   * POST /chat/send/text
   */
  async sendTextMessage(payload: TextMessagePayload): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      '/chat/send/text',
      'POST',
      payload
    );
  }

  /**
   * Send template message
   * POST /chat/send/template
   */
  async sendTemplateMessage(payload: TemplateMessagePayload): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      '/chat/send/template',
      'POST',
      payload
    );
  }

  /**
   * Send audio message
   * POST /chat/send/audio
   */
  async sendAudioMessage(payload: AudioMessagePayload): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      '/chat/send/audio',
      'POST',
      payload
    );
  }

  /**
   * Send image message
   * POST /chat/send/image
   */
  async sendImageMessage(payload: ImageMessagePayload): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      '/chat/send/image',
      'POST',
      payload
    );
  }

  /**
   * Send document message
   * POST /chat/send/document
   */
  async sendDocumentMessage(payload: DocumentMessagePayload): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      '/chat/send/document',
      'POST',
      payload
    );
  }

  /**
   * Send video message
   * POST /chat/send/video
   */
  async sendVideoMessage(payload: VideoMessagePayload): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      '/chat/send/video',
      'POST',
      payload
    );
  }

  /**
   * Send sticker message
   * POST /chat/send/sticker
   */
  async sendStickerMessage(payload: StickerMessagePayload): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      '/chat/send/sticker',
      'POST',
      payload
    );
  }

  /**
   * Send location message
   * POST /chat/send/location
   */
  async sendLocationMessage(payload: LocationMessagePayload): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      '/chat/send/location',
      'POST',
      payload
    );
  }

  /**
   * Send contact message
   * POST /chat/send/contact
   */
  async sendContactMessage(payload: ContactMessagePayload): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      '/chat/send/contact',
      'POST',
      payload
    );
  }

  /**
   * Send presence indication (typing, recording)
   * POST /chat/presence
   */
  async sendPresence(payload: PresencePayload): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      '/chat/presence',
      'POST',
      payload
    );
  }

  /**
   * Mark messages as read
   * POST /chat/markread
   */
  async markMessagesRead(payload: MarkReadPayload): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      '/chat/markread',
      'POST',
      payload
    );
  }

  /**
   * React to a message
   * POST /chat/react
   */
  async reactToMessage(payload: ReactPayload): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      '/chat/react',
      'POST',
      payload
    );
  }

  // ============================================
  // CHAT ENDPOINTS - DOWNLOAD MEDIA
  // ============================================

  /**
   * Download image
   * POST /chat/downloadimage
   */
  async downloadImage(payload: DownloadMediaPayload): Promise<any> {
    return this.request('/chat/downloadimage', 'POST', payload);
  }

  /**
   * Download video
   * POST /chat/downloadvideo
   */
  async downloadVideo(payload: DownloadMediaPayload): Promise<any> {
    return this.request('/chat/downloadvideo', 'POST', payload);
  }

  /**
   * Download audio
   * POST /chat/downloadaudio
   */
  async downloadAudio(payload: DownloadMediaPayload): Promise<any> {
    return this.request('/chat/downloadaudio', 'POST', payload);
  }

  /**
   * Download document
   * POST /chat/downloaddocument
   */
  async downloadDocument(payload: DownloadMediaPayload): Promise<any> {
    return this.request('/chat/downloaddocument', 'POST', payload);
  }

  // ============================================
  // GROUP ENDPOINTS
  // ============================================

  /**
   * List subscribed groups
   * GET /group/list
   */
  async listGroups(): Promise<GroupListResponse> {
    const response = await this.request<ApiResponse<GroupListResponse>>(
      '/group/list',
      'GET'
    );
    return response.data || { Groups: [] };
  }

  /**
   * Get group invite link
   * GET /group/invitelink
   */
  async getGroupInviteLink(groupJID: string): Promise<{ InviteLink: string }> {
    const response = await this.request<ApiResponse<{ InviteLink: string }>>(
      '/group/invitelink',
      'GET'
    );
    return response.data || { InviteLink: '' };
  }

  /**
   * Get group information
   * GET /group/info
   */
  async getGroupInfo(groupJID: string): Promise<GroupInfo> {
    const response = await this.request<ApiResponse<GroupInfo>>(
      '/group/info',
      'GET'
    );
    return response.data || ({} as GroupInfo);
  }

  /**
   * Change group photo
   * POST /group/photo
   */
  async setGroupPhoto(payload: GroupPhotoPayload): Promise<{ Details: string; PictureID: string }> {
    const response = await this.request<ApiResponse<{ Details: string; PictureID: string }>>(
      '/group/photo',
      'POST',
      payload
    );
    return response.data || { Details: '', PictureID: '' };
  }

  /**
   * Change group name
   * POST /group/name
   */
  async setGroupName(payload: GroupNamePayload): Promise<{ Details: string }> {
    const response = await this.request<ApiResponse<{ Details: string }>>(
      '/group/name',
      'POST',
      payload
    );
    return response.data || { Details: '' };
  }

  /**
   * Create group
   * POST /group/create
   */
  async createGroup(payload: CreateGroupPayload): Promise<GroupInfo> {
    const response = await this.request<ApiResponse<GroupInfo>>(
      '/group/create',
      'POST',
      payload
    );
    return response.data || ({} as GroupInfo);
  }

  /**
   * Set group locked status
   * POST /group/locked
   */
  async setGroupLocked(payload: GroupLockedPayload): Promise<{ Details: string }> {
    const response = await this.request<ApiResponse<{ Details: string }>>(
      '/group/locked',
      'POST',
      payload
    );
    return response.data || { Details: '' };
  }

  /**
   * Set disappearing timer for group
   * POST /group/ephemeral
   */
  async setGroupEphemeral(payload: GroupEphemeralPayload): Promise<{ Details: string }> {
    const response = await this.request<ApiResponse<{ Details: string }>>(
      '/group/ephemeral',
      'POST',
      payload
    );
    return response.data || { Details: '' };
  }

  /**
   * Remove group photo
   * POST /group/photo/remove
   */
  async removeGroupPhoto(payload: GroupPhotoRemovePayload): Promise<{ Details: string }> {
    const response = await this.request<ApiResponse<{ Details: string }>>(
      '/group/photo/remove',
      'POST',
      payload
    );
    return response.data || { Details: '' };
  }

  // ============================================
  // S3 STORAGE ENDPOINTS
  // ============================================

  /**
   * Configure S3 storage
   * POST /session/s3/config
   */
  async configureS3(payload: S3Config): Promise<S3Config> {
    const response = await this.request<ApiResponse<S3Config>>(
      '/session/s3/config',
      'POST',
      payload
    );
    return response.data || ({} as S3Config);
  }

  /**
   * Get S3 configuration
   * GET /session/s3/config
   */
  async getS3Config(): Promise<S3Config> {
    const response = await this.request<ApiResponse<S3Config>>(
      '/session/s3/config',
      'GET'
    );
    return response.data || ({} as S3Config);
  }

  /**
   * Test S3 connection
   * POST /session/s3/test
   */
  async testS3Connection(): Promise<{ Details: string; Bucket: string; Region: string }> {
    const response = await this.request<ApiResponse<{ Details: string; Bucket: string; Region: string }>>(
      '/session/s3/test',
      'POST'
    );
    return response.data || { Details: '', Bucket: '', Region: '' };
  }

  /**
   * Delete S3 configuration
   * DELETE /session/s3/config
   */
  async deleteS3Config(): Promise<{ Details: string }> {
    const response = await this.request<ApiResponse<{ Details: string }>>(
      '/session/s3/config',
      'DELETE'
    );
    return response.data || { Details: '' };
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Set user token
   */
  setUserToken(token: string): void {
    this.userToken = token;
  }

  /**
   * Set admin token
   */
  setAdminToken(token: string): void {
    this.adminToken = token;
  }

  /**
   * Update base URL
   */
  setBaseURL(url: string): void {
    this.baseURL = url.replace(/\/$/, '');
  }
}

// Export for use
export default WuzAPIClient;
export type {
  ApiResponse,
  UserListResponse,
  UserCreatePayload,
  TextMessagePayload,
  AudioMessagePayload,
  ImageMessagePayload,
  DocumentMessagePayload,
  VideoMessagePayload,
  StickerMessagePayload,
  LocationMessagePayload,
  ContactMessagePayload,
  GroupInfo,
  S3Config,
  ProxyConfig,
  MessageResponse,
};