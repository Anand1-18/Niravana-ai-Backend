const generateWebsite = async (req, res) => {
    try {
        const { prompt, systemOverride, currentCode } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY missing from environment');
            return res.status(500).json({ message: 'OPENROUTER_API_KEY is not configured in backend' });
        }

        const systemPrompt = `You are an expert frontend developer and UI/UX designer. The user will provide a detailed prompt describing what kind of website they want. Based on the user's description, generate a fully working, production-ready website as a **single HTML file**. Use only **HTML, Tailwind CSS (via CDN)**, vanilla JavaScript, and GSAP (via CDN).

Strict output rules:
- Return the website as a single fenced Markdown code block with the language tag \`\`\`html.
- Do NOT include any explanations, text, or extra code blocks outside that single block. Only the HTML file content.

Technical requirements:
1. **Stack**: HTML + Tailwind CSS (via CDN) + vanilla JavaScript + GSAP (via CDN). Everything in one file.
2. **Responsive**: Must be fully responsive (mobile, tablet, desktop) with modern grid and flex layouts.
3. **Theme**: Default **dark mode**, but if the website type fits better in light mode, auto-select light mode. Include a **toggle button** to switch between dark and light themes.
4. **Animations & Interactions**:
    - GSAP scroll-based animations (fade, slide, stagger, parallax).
    - Smooth hover effects with scale, shadow, and gradient transitions.
    - Sticky navbar with subtle shadow on scroll.
    - Animated gradient backgrounds or floating decorative shapes.
5. **Visual richness**:
    - Use high-quality **royalty-free images** (Unsplash via direct URLs).
    - Apply **soft shadows, glassmorphism, or neumorphism** effects where suitable.
    - Modern cards, rounded corners, gradient buttons, hover animations.
6. **UI Sections** (as per user request):
    - Sticky **Navbar** with logo + links + theme toggle.
    - **Hero section** with headline, subheadline, CTA button, and background image/gradient.
    - **Main content**: features grid, product showcase, gallery, blog cards, or whatever fits user's request.
    - **Call to Action** with strong button.
    - **Footer** with the text: "Made with NirvanaAI"
7. **Code quality**: Clean, semantic HTML5, ARIA labels for accessibility, well-indented, professional Tailwind usage.
8. **Performance**: Optimized. No external CSS/JS frameworks beyond Tailwind + GSAP. Use responsive images, gradients, inline SVGs, or Unsplash placeholders.

Final instruction: Output only the single fenced Markdown code block with the full HTML file content. Nothing else.`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:5173',
                'X-OpenRouter-Title': 'NirvanaMax Website Builder',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: systemOverride || systemPrompt,
                    },
                    {
                        role: 'user',
                        content: currentCode
                            ? `Here is the current HTML code:\n\`\`\`html\n${currentCode}\n\`\`\`\n\nPlease update and modify the above code based on this request: ${prompt}`
                            : `${systemOverride ? '' : 'Website prompt: '}${prompt}`,
                    },
                ],
                max_tokens: 3500,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API Error:', response.status, errorText);
            throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        // Handle OpenRouter error responses (sometimes 200 but with error field)
        if (data.error) {
            throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        const choices = data.choices || [];
        if (choices.length === 0) {
            throw new Error('No choices returned from OpenRouter API');
        }

        const generatedText = choices[0]?.message?.content || '';
        if (!generatedText) {
            throw new Error('Empty content returned from OpenRouter API');
        }

        res.status(200).json({ result: generatedText });

    } catch (error) {
        console.error('AI Generation Error:', error.message);
        res.status(500).json({
            message: 'AI Generation Failed: ' + (error.message || 'Unknown error'),
            error: error.message,
        });
    }
};

module.exports = { generateWebsite };
