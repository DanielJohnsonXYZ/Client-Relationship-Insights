import { logger } from './logger'

export interface BasecampProject {
  id: number
  name: string
  description: string
  purpose: string
  status: string
  created_at: string
  updated_at: string
  url: string
  app_url: string
  dock: Array<{
    id: number
    title: string
    name: string
    enabled: boolean
    position: number
    url: string
    app_url: string
  }>
}

export interface BasecampMessage {
  id: number
  status: string
  created_at: string
  updated_at: string
  title: string
  content: string
  url: string
  app_url: string
  comments_count: number
  comments: BasecampComment[]
  creator: BasecampPerson
}

export interface BasecampComment {
  id: number
  status: string
  created_at: string
  updated_at: string
  content: string
  url: string
  app_url: string
  creator: BasecampPerson
}

export interface BasecampTodoList {
  id: number
  status: string
  created_at: string
  updated_at: string
  name: string
  description: string
  completed: boolean
  completed_ratio: string
  url: string
  app_url: string
  todos_url: string
  todos: BasecampTodo[]
}

export interface BasecampTodo {
  id: number
  status: string
  created_at: string
  updated_at: string
  title: string
  inherits_status: boolean
  completed: boolean
  url: string
  app_url: string
  creator: BasecampPerson
  assignees: BasecampPerson[]
  completion?: {
    created_at: string
    creator: BasecampPerson
  }
}

export interface BasecampPerson {
  id: number
  attachable_sgid: string
  name: string
  email_address: string
  personable_type: string
  title?: string
  bio?: string
  location?: string
  created_at: string
  updated_at: string
  admin: boolean
  owner: boolean
  client: boolean
  employee: boolean
  time_zone: string
  avatar_url: string
  company: {
    id: number
    name: string
  }
}

export interface BasecampChatMessage {
  id: number
  status: string
  created_at: string
  updated_at: string
  title: string
  content: string
  url: string
  app_url: string
  creator: BasecampPerson
}

export class BasecampClient {
  private accessToken: string
  private accountId: string
  private baseUrl: string
  private userAgent: string

  constructor(accessToken: string, accountId: string, userEmail: string = 'support@clientinsights.com') {
    this.accessToken = accessToken
    this.accountId = accountId
    this.baseUrl = `https://3.basecampapi.com/${accountId}`
    this.userAgent = `Client Relationship Insights (${userEmail})`
  }

  async getProjects(): Promise<BasecampProject[]> {
    logger.info('Fetching Basecamp projects', { accountId: this.accountId })
    return this.makeRequest('/projects.json')
  }

  async getProject(projectId: string): Promise<BasecampProject> {
    return this.makeRequest(`/projects/${projectId}.json`)
  }

  async getProjectMessages(projectId: string): Promise<BasecampMessage[]> {
    logger.info('Fetching project messages', { projectId })
    
    // Get message board first
    const project = await this.getProject(projectId)
    const messageBoard = project.dock.find(tool => tool.name === 'message_board')
    
    if (!messageBoard) {
      logger.warn('No message board found for project', { projectId })
      return []
    }
    
    const messages: BasecampMessage[] = await this.makeRequest(messageBoard.url.replace(this.baseUrl, '') + '/messages.json')
    
    // Fetch comments for each message
    for (const message of messages) {
      if (message.comments_count > 0) {
        message.comments = await this.makeRequest(message.url.replace(this.baseUrl, '') + '/comments.json')
      }
    }
    
    return messages
  }

  async getProjectTodoLists(projectId: string): Promise<BasecampTodoList[]> {
    logger.info('Fetching project todo lists', { projectId })
    
    const project = await this.getProject(projectId)
    const todoset = project.dock.find(tool => tool.name === 'todoset')
    
    if (!todoset) {
      logger.warn('No todo set found for project', { projectId })
      return []
    }
    
    const todoLists: BasecampTodoList[] = await this.makeRequest(todoset.url.replace(this.baseUrl, '') + '/todolists.json')
    
    // Fetch todos for each list
    for (const list of todoLists) {
      if (list.todos_url) {
        list.todos = await this.makeRequest(list.todos_url.replace(this.baseUrl, ''))
      }
    }
    
    return todoLists
  }

  async getProjectChatMessages(projectId: string): Promise<BasecampChatMessage[]> {
    logger.info('Fetching project chat messages', { projectId })
    
    const project = await this.getProject(projectId)
    const campfire = project.dock.find(tool => tool.name === 'campfire')
    
    if (!campfire) {
      logger.warn('No campfire found for project', { projectId })
      return []
    }
    
    return this.makeRequest(campfire.url.replace(this.baseUrl, '') + '/lines.json')
  }

  async getPeople(): Promise<BasecampPerson[]> {
    logger.info('Fetching Basecamp people', { accountId: this.accountId })
    return this.makeRequest('/people.json')
  }

  async getCurrentUser(): Promise<BasecampPerson> {
    return this.makeRequest('/my/profile.json')
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
    
    logger.debug('Making Basecamp API request', { url })
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': this.userAgent,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Basecamp API error', { 
          status: response.status, 
          statusText: response.statusText,
          url,
          error: errorText
        })
        
        if (response.status === 401) {
          throw new Error('Basecamp authentication failed - token may be expired')
        } else if (response.status === 403) {
          throw new Error('Basecamp access denied - insufficient permissions')
        } else if (response.status === 429) {
          throw new Error('Basecamp rate limit exceeded - please try again later')
        } else {
          throw new Error(`Basecamp API error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()
      logger.debug('Basecamp API response successful', { endpoint, dataLength: Array.isArray(data) ? data.length : 1 })
      
      return data
    } catch (error) {
      logger.error('Basecamp API request failed', { error, endpoint })
      throw error
    }
  }
}

// Helper function to extract email from Basecamp data for client matching
export function extractClientEmails(data: BasecampMessage[] | BasecampComment[] | BasecampTodo[]): string[] {
  const emails = new Set<string>()
  
  for (const item of data) {
    if (item.creator?.email_address && item.creator.client) {
      emails.add(item.creator.email_address)
    }
    
    // For todos, also check assignees
    if ('assignees' in item && item.assignees) {
      for (const assignee of item.assignees) {
        if (assignee.email_address && assignee.client) {
          emails.add(assignee.email_address)
        }
      }
    }
  }
  
  return Array.from(emails)
}

// Helper function to identify if a Basecamp person is a client
export function isBasecampClient(person: BasecampPerson): boolean {
  return person.client === true || !person.employee
}