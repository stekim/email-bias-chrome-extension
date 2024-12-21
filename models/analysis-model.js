// Analysis Model Definitions

/**
 * @typedef {Object} CredibilityScore
 * @property {number} deceptive - Score indicating deceptive content (0-1)
 * @property {number} fakeNews - Score indicating likelihood of fake news (0-1)
 * @property {number} trustworthy - Score indicating trustworthiness (0-1)
 * @property {number} objective - Score indicating objectivity (0-1)
 */

/**
 * @typedef {Object} PoliticalScore
 * @property {number} conservative - Score indicating conservative bias (0-1)
 * @property {number} liberal - Score indicating liberal bias (0-1)
 */

/**
 * @typedef {Object} StructureAnalysis
 * @property {('Simple'|'Standard'|'Complex')} format - Email format classification
 * @property {number} paragraphs - Number of paragraphs
 * @property {('Low'|'Medium'|'High')} readability - Readability score
 */

/**
 * @typedef {Object} SenderInfo
 * @property {string} name - Sender's name
 * @property {string} email - Sender's email address
 * @property {boolean} verified - Whether the sender is verified
 * @property {number} reputation - Sender's reputation score (0-100)
 */

/**
 * @typedef {Object} AnalysisMetadata
 * @property {string} analyzedAt - ISO timestamp of analysis
 * @property {string} emailSubject - Subject of analyzed email
 * @property {number} contentLength - Length of analyzed content
 * @property {string} modelVersion - Version of analysis model used
 */

/**
 * @typedef {Object} EmailAnalysis
 * @property {CredibilityScore} credibility - Credibility analysis scores
 * @property {PoliticalScore} political - Political bias analysis scores
 * @property {StructureAnalysis} structure - Email structure analysis
 * @property {SenderInfo} sender - Information about the sender
 * @property {AnalysisMetadata} metadata - Analysis metadata
 */

class AnalysisModel {
    static SCORE_THRESHOLDS = {
        LOW: 0.3,
        MEDIUM: 0.6,
        HIGH: 0.8
    };

    static READABILITY_LEVELS = {
        LOW: 'Low',
        MEDIUM: 'Medium',
        HIGH: 'High'
    };

    static EMAIL_FORMATS = {
        SIMPLE: 'Simple',
        STANDARD: 'Standard',
        COMPLEX: 'Complex'
    };

    /**
     * Validates and normalizes a score to ensure it's between 0 and 1
     * @param {number} score - Raw score to validate
     * @returns {number} - Normalized score between 0 and 1
     */
    static normalizeScore(score) {
        if (typeof score !== 'number') return 0;
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Validates credibility scores
     * @param {CredibilityScore} credibility - Credibility scores to validate
     * @returns {CredibilityScore} - Validated credibility scores
     */
    static validateCredibility(credibility) {
        return {
            deceptive: this.normalizeScore(credibility?.deceptive),
            fakeNews: this.normalizeScore(credibility?.fakeNews),
            trustworthy: this.normalizeScore(credibility?.trustworthy),
            objective: this.normalizeScore(credibility?.objective)
        };
    }

    /**
     * Validates political bias scores
     * @param {PoliticalScore} political - Political scores to validate
     * @returns {PoliticalScore} - Validated political scores
     */
    static validatePolitical(political) {
        return {
            conservative: this.normalizeScore(political?.conservative),
            liberal: this.normalizeScore(political?.liberal)
        };
    }

    /**
     * Validates structure analysis
     * @param {StructureAnalysis} structure - Structure analysis to validate
     * @returns {StructureAnalysis} - Validated structure analysis
     */
    static validateStructure(structure) {
        const format = Object.values(this.EMAIL_FORMATS).includes(structure?.format)
            ? structure.format
            : this.EMAIL_FORMATS.STANDARD;

        const paragraphs = typeof structure?.paragraphs === 'number'
            ? Math.max(1, Math.round(structure.paragraphs))
            : 1;

        const readability = Object.values(this.READABILITY_LEVELS).includes(structure?.readability)
            ? structure.readability
            : this.READABILITY_LEVELS.MEDIUM;

        return { format, paragraphs, readability };
    }

    /**
     * Validates sender information
     * @param {SenderInfo} sender - Sender information to validate
     * @returns {SenderInfo} - Validated sender information
     */
    static validateSender(sender) {
        return {
            name: sender?.name || 'Unknown Sender',
            email: sender?.email || 'unknown@example.com',
            verified: Boolean(sender?.verified),
            reputation: Math.max(0, Math.min(100, sender?.reputation || 0))
        };
    }

    /**
     * Validates analysis metadata
     * @param {AnalysisMetadata} metadata - Metadata to validate
     * @returns {AnalysisMetadata} - Validated metadata
     */
    static validateMetadata(metadata) {
        return {
            analyzedAt: metadata?.analyzedAt || new Date().toISOString(),
            emailSubject: metadata?.emailSubject || 'No Subject',
            contentLength: metadata?.contentLength || 0,
            modelVersion: '1.0.0'
        };
    }

    /**
     * Validates a complete email analysis
     * @param {EmailAnalysis} analysis - Complete analysis to validate
     * @returns {EmailAnalysis} - Validated analysis
     */
    static validateAnalysis(analysis) {
        try {
            // Ensure all required sections exist
            if (!analysis.credibility || !analysis.political || !analysis.structure) {
                throw new Error('Missing required analysis sections');
            }

            // Validate credibility scores
            const credibilityScores = ['deceptive', 'fakeNews', 'trustworthy', 'objective'];
            credibilityScores.forEach(score => {
                if (typeof analysis.credibility[score] !== 'number' || 
                    analysis.credibility[score] < 0 || 
                    analysis.credibility[score] > 1) {
                    throw new Error(`Invalid credibility score: ${score}`);
                }
            });

            // Validate political scores
            const politicalScores = ['conservative', 'liberal'];
            politicalScores.forEach(score => {
                if (typeof analysis.political[score] !== 'number' || 
                    analysis.political[score] < 0 || 
                    analysis.political[score] > 1) {
                    throw new Error(`Invalid political score: ${score}`);
                }
            });

            // Validate structure analysis
            if (!['Simple', 'Standard', 'Complex'].includes(analysis.structure.format)) {
                throw new Error('Invalid format value');
            }

            if (typeof analysis.structure.paragraphs !== 'number' || 
                analysis.structure.paragraphs < 0) {
                throw new Error('Invalid paragraphs count');
            }

            if (!['Low', 'Medium', 'High'].includes(analysis.structure.readability)) {
                throw new Error('Invalid readability value');
            }

            return analysis;
        } catch (error) {
            console.error('❌ Analysis validation error:', error);
            throw error;
        }
    }

    /**
     * Gets interpretation of a score
     * @param {number} score - Score to interpret
     * @returns {'Low'|'Medium'|'High'} - Score interpretation
     */
    static interpretScore(score) {
        if (score <= this.SCORE_THRESHOLDS.LOW) return 'Low';
        if (score <= this.SCORE_THRESHOLDS.MEDIUM) return 'Medium';
        return 'High';
    }

    /**
     * Gets overall bias assessment
     * @param {EmailAnalysis} analysis - Complete analysis
     * @returns {Object} - Bias assessment
     */
    static getOverallAssessment(analysis) {
        const validated = this.validateAnalysis(analysis);
        
        return {
            credibilityLevel: this.interpretScore(validated.credibility.trustworthy),
            objectivityLevel: this.interpretScore(validated.credibility.objective),
            politicalBias: validated.political.conservative > validated.political.liberal 
                ? 'Conservative' 
                : validated.political.liberal > validated.political.conservative
                    ? 'Liberal'
                    : 'Neutral',
            biasStrength: this.interpretScore(
                Math.abs(validated.political.conservative - validated.political.liberal)
            )
        };
    }
}
