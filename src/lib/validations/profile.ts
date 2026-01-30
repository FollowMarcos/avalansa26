/**
 * Profile-related validation logic
 */

const HARMFUL_KEYWORDS = [
    'porn', 'xvideos', 'pornhub', 'redtube', 'xnxx', 'phub', 'sex', 'casino', 'betting', 'gambling',
    'malware', 'phishing', 'virus', 'warez', 'hack', 'crack', 'torrents'
];

const FORBIDDEN_WORDS = [
    'nigger', 'nigga', 'faggot', 'kike', 'whore', 'slut', 'cunt', 'retard', 'hitler', 'nazi'
];

/**
 * Checks if a string contains any forbidden or harmful content
 */
export function validateContentSafety(text: string | null | undefined): { isValid: boolean; error?: string } {
    if (!text) return { isValid: true };

    const lowerText = text.toLowerCase().replace(/[^a-z0-9]/g, ''); // Basic leetspeak/bypass check

    const isForbidden = FORBIDDEN_WORDS.some(word => lowerText.includes(word));
    if (isForbidden) {
        return { isValid: false, error: 'Contains prohibited language' };
    }

    return { isValid: true };
}

/**
 * Validates a website URL for safety and format
 */
export function validateWebsite(url: string | null | undefined): { isValid: boolean; error?: string } {
    if (!url) return { isValid: true };

    // Basic URL regex
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if (!urlRegex.test(url)) {
        return { isValid: false, error: 'Please enter a valid URL' };
    }

    // Safety check
    const lowerUrl = url.toLowerCase();
    const isHarmful = [...HARMFUL_KEYWORDS, ...FORBIDDEN_WORDS].some(keyword => lowerUrl.includes(keyword));

    if (isHarmful) {
        return { isValid: false, error: 'This website is not allowed for safety reasons' };
    }

    return { isValid: true };
}
