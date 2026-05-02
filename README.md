# QCTO SDP Opportunity Platform with Gemma Learnership Assistant

A data-driven web platform that helps South Africans explore QCTO accredited Skills Development Providers, possible learnership pathways, qualifications, provinces, SETAs or Quality Partners, and provider contact details.

The project combines a Power BI-inspired dashboard design, a searchable web interface, and a Gemma-powered assistant that helps users ask questions in everyday language and receive practical guidance.

---

## Live Project

Add the live Netlify link here:

```text
https://qcto-sdp-gemma-platform.netlify.app/
```

## Repository

Add the GitHub repository link here:

```text
https://github.com/jxhannn/qcto-sdp-gemma-platform
```

---

## Project Overview

This project was created to make it easier for people to discover possible learnership pathways and accredited training providers in South Africa.

Many people search for learnerships only when adverts are posted online. By that time, there are often many applicants competing for the same opportunity. This platform takes a different approach by helping users find accredited Skills Development Providers that are linked to the qualification or career path they are interested in.

The platform does not guarantee that a provider currently has an open learnership. Instead, it helps users find possible providers to contact directly.

Users can explore:

- Accredited Skills Development Providers
- Provinces and towns
- Career pathways
- Qualification titles
- NQF levels
- SETAs or Quality Partners
- Provider contact details
- Active accreditation records
- AI-assisted guidance through Gemma

---

## Why I Built This Project

I built this project because finding learnerships can be confusing and time-consuming, especially for unemployed youth, matriculants, and people who do not know which qualification or provider to search for.

The goal is to help people move from a broad career interest to possible training providers they can contact.

For example, instead of only searching online for “IT learnerships,” a user can ask:

```text
I live in Gauteng and I am interested in computers. What learnership path can I look for?
```

The platform can then suggest possible ICT pathways, related qualifications, provider records, and an enquiry message the user can send to providers.

---

## Main Goal

The main goal of the project is to make learnership discovery easier, more practical, and more accessible.

The platform is designed to help users:

- Discover providers by province, career field, qualification, or SETA
- Understand which qualifications may connect to their interests
- Find provider contact details where available
- Use ready-made enquiry messages to contact providers professionally
- Search using normal language through the Gemma assistant
- Explore multiple possible pathways instead of relying on one job title

---

## Target Users

This project is useful for:

- Unemployed youth
- Matriculants
- Learnership applicants
- Career changers
- People exploring practical training options
- People unsure which qualification to search for
- People who want to contact accredited providers directly
- People interested in SETA-funded or QCTO-related training opportunities

---

## Data Source

The platform is based on QCTO accredited Skills Development Provider data.

Source:

```text
https://www.qcto.org.za/databases-of-sdps.html
```

The dataset includes provider-related information such as:

- Provider name
- Province
- Town or city
- Career or occupational area
- Qualification title
- NQF level
- SETA or Quality Partner
- Accreditation status
- Email address where available
- Contact number where available

The data contains many accreditation records. One provider can appear more than once because a provider may be accredited for multiple qualifications. For this reason, the project treats accreditation records, provider names, career paths, and active records carefully.

---

## Important Disclaimer

This platform is not an official QCTO website.

The project uses QCTO SDP data for educational, research, portfolio, and discovery purposes.

Accreditation does not guarantee that a provider currently has an open learnership intake. Users must contact providers directly to confirm:

- Whether applications are open
- Whether a learnership intake is currently available
- What the requirements are
- What documents are needed
- Whether the provider is still offering the programme
- Whether the accreditation details are still current

---

## Key Features

### 1. Home Page

The home page introduces the project and shows a dashboard-style overview of the platform.

It includes:

- Project introduction
- QCTO provider discovery concept
- SETA or Quality Partner card
- Career and qualification exploration idea
- Navigation to Explore, Careers, About, and Gemma Assistant features

### 2. Explore Page

The Explore page allows users to search and filter provider records.

Users can filter by:

- Province
- Career
- Qualification
- Provider
- City or town
- SETA or Quality Partner
- Accreditation status

It also includes:

- South Africa map card
- Clickable province names
- Provider table
- Loading state while records load

### 3. Careers Page

The Careers page helps users think about career pathways and related qualifications.

The goal is to support users who may know the type of work they are interested in but do not know the exact qualification name.

### 4. About Page

The About page explains:

- What the project is
- Why it was created
- What QCTO is
- Where the data comes from
- The purpose of the platform
- The project creator’s goal

### 5. Gemma Learnership Assistant

The Gemma assistant allows users to ask questions in normal language.

Example prompts:

```text
I live in Gauteng and I am interested in computers. What learnership path can I look for?
```

```text
I stay around Randburg and I only have matric, what business admin learnerships can I look for?
```

```text
I want to help children or young people, but I don’t want nursing or university.
```

The assistant can return:

- Practical guidance
- Possible career pathways
- Related qualifications
- Matching provider records
- Clickable provider emails
- A provider enquiry message
- A reminder that accreditation does not guarantee a current learnership intake

---

## Gemma Assistant Logic

The assistant was designed to support different types of user questions.

It tries to understand:

- Province
- City or town
- Career interest
- Sector
- Exact qualification names
- Broad career interests
- Negative intent such as “not nursing,” “not accounting,” “not IT,” or “not office work”

It supports areas such as:

- ICT and computers
- Data, coding, IT support, cloud, cybersecurity
- Business administration
- Hospitality and housekeeping
- Food and cooking
- Construction and trades
- Agriculture and nature
- Finance and accounting
- Children, ECD, and teaching support
- Healthcare, counselling, and community support
- Safety, security, and investigation
- Logistics, warehousing, and supply chain
- Mining and plant operation
- Media, design, photography, and marketing
- Beauty, hair, and nails
- Electrical, solar, and renewable energy
- Practical options after matric

---

## Technology Stack

The project uses:

- HTML
- CSS
- JavaScript
- Netlify Functions
- Netlify Dev
- GitHub
- Netlify
- Gemma
- QCTO SDP data
- Power BI-inspired dashboard design

The earlier version of the project was developed as a Power BI dashboard before being turned into a web prototype.

---

## Development Process

The project was built in stages.

### Stage 1: Data Exploration

The QCTO SDP dataset was explored and cleaned. The goal was to understand provider records, qualifications, provinces, SETAs, and accreditation statuses.

### Stage 2: Power BI Dashboard

A Power BI dashboard was created to explore the data visually. This helped shape the structure of the web version.

### Stage 3: Web Prototype

The project was rebuilt as a web interface using HTML, CSS, and JavaScript.

### Stage 4: Gemma Assistant

A Gemma-powered assistant was added to help users search using natural language.

### Stage 5: Local Testing

The project was tested locally using Netlify Dev and Netlify Functions.

### Stage 6: Fine-Tuning

The assistant was tested with many random prompts to improve filtering and relevance.

### Stage 7: Deployment Preparation

The project was uploaded to GitHub and prepared for Netlify deployment.

---

## Problems Faced and Solved

During development, several issues came up.

### Assistant Timeout

The assistant sometimes took too long to respond. This caused timeout errors in the browser.

Solution:

- Added fallback guidance
- Improved JSON error handling
- Reduced long wait times
- Used project data to return fast guidance when needed

### Wrong Matches

Some prompts returned unrelated results.

Examples:

- Housekeeping matched “Beam House Machine Operator”
- Cloud computing matched unrelated development records
- Practical work matched office administration
- Animals and nature matched unrelated trade records
- Media and design matched unrelated emergency response records

Solution:

- Improved keyword groups
- Added negative intent rules
- Improved sector matching
- Adjusted Explore filters
- Tested many different prompt types

### Explore Filtering Was Too Narrow

At one stage, the Explore page filtered only by the first recommended qualification.

Solution:

- Updated the logic so Explore shows broader related records unless the user asks for an exact qualification.

### Table Loading Was Not Clear

The Explore table took time to load, but users could not easily tell that loading was happening.

Solution:

- Added loading text and a visible loading state.

### Map Issues

The Explore map had layout and click issues.

Solution:

- Adjusted the map card size
- Restored clickable province names
- Improved spacing between the card title and province list

### SETA Logo Issues

The SETA logo card had loading and switching issues.

Solution:

- Optimized logo handling
- Improved logo switching
- Reduced dependency on slow external loading
- Improved homepage performance

---

## Local Setup

To run the project locally:

```bash
npm install
netlify dev
```

Then open:

```text
http://localhost:8888
```

Create a local `.env` file with:

```env
GEMINI_API_KEY=your_api_key_here
GEMMA_MODEL=gemma-4-26b-a4b-it
```

Do not upload `.env` to GitHub.

---

## Netlify Deployment Notes

The project is designed to work with Netlify.

Important files:

```text
netlify.toml
netlify/functions/assistant.js
netlify/functions/data/providers_compact.json
```

Environment variables must be added inside Netlify:

```env
GEMINI_API_KEY=your_api_key_here
GEMMA_MODEL=gemma-4-26b-a4b-it
```

Do not put API keys in frontend JavaScript or GitHub.

---

## Files Not to Upload

Do not upload:

```text
.env
.netlify
node_modules
```

These files are local-only or private.

---

## Example Assistant Output

Prompt:

```text
I live in Gauteng and I am interested in computers. What learnership path can I look for?
```

The assistant may suggest pathways such as:

- Computer and Digital Support Assistant
- Computer Technician
- Software Developer
- Software Engineer
- AI Software Developer
- Software Tester

It can also show matching providers, related qualifications, emails, and a provider enquiry message.

---

## Hackathon or Portfolio Value

This project is suitable for a hackathon or portfolio presentation because it combines:

- A real public dataset
- A clear social problem
- A dashboard-style interface
- AI-assisted search
- Provider discovery
- Practical impact for unemployed people and learnership seekers

The project shows how data, AI, and public skills-development information can be combined to support people searching for training opportunities.

---

## Future Improvements

Possible future improvements include:

- Better mobile responsiveness
- Saved provider lists
- Downloadable filtered results
- More advanced city-distance search
- Stronger career-to-qualification mapping
- More detailed provider profile pages
- Updated QCTO data refresh process
- More advanced Gemma prompt handling
- Analytics to see what users search for most
- A demo video for LinkedIn and portfolio use

---

## Creator

Created by Johanne Maziya.

This project was built as part of a personal data and AI portfolio, with the goal of helping South Africans search for possible learnership pathways more easily.

---

## Final Note

This project does not replace official learnership adverts or official provider communication. It is a discovery tool that helps users identify possible accredited providers and take the next step by contacting them directly.
