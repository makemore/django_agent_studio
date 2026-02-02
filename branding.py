"""
Branding configuration for Django Agent Studio.

This module provides customizable branding settings that can be overridden
in Django settings via the AGENT_STUDIO_BRANDING dictionary.

Example settings.py configuration:

    AGENT_STUDIO_BRANDING = {
        'app_name': 'My Agent Studio',
        'logo_svg': '<svg>...</svg>',  # Custom logo SVG
        'colors': {
            'primary': '#00142E',
            'accent': '#4fc4f7',
            'secondary': '#253547',
        },
    }
"""

from django.conf import settings


# Default branding configuration
DEFAULT_BRANDING = {
    # Application name
    'app_name': 'Agent Studio',
    
    # Logo - SVG markup (displayed in header)
    # Default is a simple "AS" text logo
    'logo_svg': '''
        <svg viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-7">
            <text x="0" y="24" fill="currentColor" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700">AS</text>
        </svg>
    ''',
    
    # Whether to show app name next to logo
    'show_app_name': True,
    
    # Colors - these are the defaults (professional blue/cyan theme)
    'colors': {
        # Primary color - used for header, primary buttons, main text
        'primary': '#00142E',
        'primary_light': '#0a2540',
        'primary_dark': '#000d1f',
        
        # Accent color - used for highlights, focus rings, CTAs
        'accent': '#4fc4f7',
        'accent_light': '#7dd3fc',
        'accent_dark': '#3db8eb',
        
        # Secondary color - used for secondary backgrounds, gradients
        'secondary': '#253547',
        'secondary_light': '#334155',
        'secondary_dark': '#1e293b',
    },
    
    # Chat widget primary color (used by agent-frontend)
    'chat_primary_color': '#00142E',
    
    # Custom CSS to inject (optional)
    'custom_css': '',
}


def get_branding():
    """
    Get the merged branding configuration.
    
    Merges user settings from AGENT_STUDIO_BRANDING with defaults.
    """
    user_branding = getattr(settings, 'AGENT_STUDIO_BRANDING', {})
    
    # Deep merge colors
    merged = DEFAULT_BRANDING.copy()
    
    for key, value in user_branding.items():
        if key == 'colors' and isinstance(value, dict):
            # Merge colors dict
            merged['colors'] = {**DEFAULT_BRANDING['colors'], **value}
        else:
            merged[key] = value
    
    return merged


def branding_context_processor(request):
    """
    Django context processor that adds branding to all templates.
    
    Add to settings.py TEMPLATES['OPTIONS']['context_processors']:
        'django_agent_studio.branding.branding_context_processor',
    """
    branding = get_branding()
    
    return {
        'studio_branding': branding,
        'studio_app_name': branding['app_name'],
        'studio_logo_svg': branding['logo_svg'],
        'studio_show_app_name': branding['show_app_name'],
        'studio_colors': branding['colors'],
        'studio_chat_primary_color': branding['chat_primary_color'],
        'studio_custom_css': branding['custom_css'],
    }
