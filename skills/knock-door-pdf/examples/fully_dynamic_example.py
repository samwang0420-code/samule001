"""
Fully Dynamic PDF Generation Example
All scores and competitor data are customizable
"""

from skills.knock_door_pdf.core.pdf_generator import generate_report

# Assessment data with DYNAMIC scores
assessment_data = {
    'url': 'https://elite-aesthetic.com',
    'overall': {
        'grade': 'C',
        'combined_score': 54
    },
    'scores': {
        'technical_seo': {'score': 65},
        'content_seo': {'score': 72},
        'offsite_seo': {'score': 58},
        'user_experience': {'score': 78},
        'ai_visibility': {'score': 28}  # Client's actual AI visibility
    },
    # DYNAMIC competitor data with real scores
    'competitors': [
        {
            'name': 'Dr. Smith Aesthetics',
            'ai_visibility': 82,  # Dynamic score
            'chatgpt': True,
            'claude': True,
            'perplexity': True,
            'google': True
        },
        {
            'name': 'Beverly Hills Clinic',
            'ai_visibility': 76,  # Dynamic score
            'chatgpt': True,
            'claude': True,
            'perplexity': True,
            'google': False
        },
        {
            'name': 'Elite Plastic Surgery',
            'ai_visibility': 71,  # Dynamic score
            'chatgpt': False,
            'claude': True,
            'perplexity': True,
            'google': True
        }
    ]
}

# Dynamic content
custom_content = {
    'industry_name': 'Plastic Surgery',
    'keywords': 'Rhinoplasty / Breast Augmentation / Facelift',
    'pain_points': [
        'When patients ask ChatGPT "best plastic surgeon in Beverly Hills", your practice is not mentioned',
        'AI recommends Dr. Smith Aesthetics for "breast augmentation consultation" queries',
        'High-value facelift patients are being diverted to Beverly Hills Clinic through AI referrals'
    ],
    # Competitor names must match assessment_data['competitors'] if using dynamic scores
    'competitors': [
        'Dr. Smith Aesthetics',
        'Beverly Hills Clinic',
        'Elite Plastic Surgery'
    ],
    'metrics': {
        'monthly_traffic': 25000,
        'avg_deal': 18500,
        'conversion_rate': 0.025
    },
    'geo_hooks': [
        'AI recommends Dr. Smith for rhinoplasty procedures',
        'Your breast augmentation portfolio is not indexed by AI',
        'Patients asking about facelift recovery are directed to Beverly Hills Clinic'
    ],
    'action_items': [
        'Deploy Medical Schema Markup for rhinoplasty and breast augmentation',
        'Create AI-readable service catalog (llms.txt)',
        'Build local entity graph for Beverly Hills + Plastic Surgery',
        'Implement review aggregation with before/after outcomes'
    ]
}

# Generate PDF with dynamic scores
pdf_path = generate_report(
    data=assessment_data,
    content=custom_content,
    client_name="Elite Aesthetic Center",
    output_dir="./output"
)

print(f"PDF generated: {pdf_path}")
print("\n" + "="*60)
print("DYNAMIC DATA USED:")
print("="*60)
print(f"Client AI Visibility: {assessment_data['scores']['ai_visibility']['score']}/100")
print("\nCompetitor Scores:")
for comp in assessment_data['competitors']:
    print(f"  • {comp['name']}: {comp['ai_visibility']}/100")
    print(f"    Platforms: ChatGPT={comp['chatgpt']}, Claude={comp['claude']}, Perplexity={comp['perplexity']}, Google={comp['google']}")
