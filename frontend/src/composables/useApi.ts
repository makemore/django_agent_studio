/**
 * API utilities for making authenticated requests
 */

export function getCsrfToken(): string {
  const name = 'csrftoken'
  let cookieValue = ''
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const trimmed = cookie.trim()
      if (trimmed.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(trimmed.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue || window.STUDIO_CONFIG?.csrfToken || ''
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || error.message || `Request failed: ${response.status}`)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export async function apiGet<T>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: 'GET' })
}

export async function apiPost<T>(url: string, data?: any): Promise<T> {
  return apiFetch<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function apiPut<T>(url: string, data: any): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function apiPatch<T>(url: string, data: any): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function apiDelete(url: string): Promise<void> {
  await apiFetch(url, { method: 'DELETE' })
}

