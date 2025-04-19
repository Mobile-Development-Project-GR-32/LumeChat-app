
 // Application constants

// Status options for user profiles
export const USER_STATUSES = [
    { icon: 'sentiment-satisfied', text: 'Available', color: '#43B581' },
    { icon: 'schedule', text: 'Away', color: '#FAA61A' },
    { icon: 'do-not-disturb-on', text: 'Do Not Disturb', color: '#F04747' },
    { icon: 'remove-circle-outline', text: 'Offline', color: '#747F8D' },
    { icon: 'chat', text: 'Hey there! I am using LumeChat', color: '#7289DA' },
];

// Channel categories
export const CHANNEL_CATEGORIES = [
    'INFORMATION',
    'GENERAL',
    'STUDY_GROUPS',
    'PROJECTS',
    'VOICE_CHANNELS'
];

// Theme colors for the app
export const THEME_COLORS = {
    primary: '#7289DA',
    primaryDark: '#5865F2',
    secondary: '#4752C4',
    accent: '#43B581',
    danger: '#F04747',
    warning: '#FAA61A',
    background: {
        dark: '#36393F',
        darker: '#2F3136',
        darkest: '#202225',
    },
    text: {
        primary: '#FFFFFF',
        secondary: '#B9BBBE',
        muted: '#8E9297',
        inactive: '#72767D',
    }
};

export default {
    USER_STATUSES,
    CHANNEL_CATEGORIES,
    THEME_COLORS
};
