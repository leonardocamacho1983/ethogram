# Ethogram market-sizing model — 2026

**Snapshot:** 30 August 2026  
**Purpose:** supporting calculation sheet for the Ethogram market-opportunity report.  
**Status:** directional model; assumptions are not observed Ethogram customer data.

## Market boundary

The model estimates teams that are plausibly addressable by the current Ethogram wedge:

- TypeScript/Node projects;
- AI agents that call tools;
- projects beyond a disposable demo;
- teams that repeatedly change prompts, models, tools, policies or code;
- a future paid team product layered above the current local OSS alpha.

It does not treat the entire AI-agent market as Ethogram TAM.

## Sourced anchors

- GitHub reported more than 1.1 million public repositories using an LLM SDK in Octoverse 2025.
- GitHub reported 693,867 of those repositories were created in the preceding 12 months, up 178% year over year.
- GitHub reported that 81.5% of contributions occurred in private repositories.
- SlashData estimated 36.5 million professional developers globally in Q1 2025.
- Adjacent public self-serve pricing ranged from US$29/month for Langfuse Core to US$249/month for Braintrust Pro; LangSmith Plus was US$39/seat/month, excluding usage.

## Formula

```text
relevant repositories
  = 1,100,000 public LLM-SDK repositories
  × assumed JavaScript/TypeScript share
  × assumed mature tool-using share

serviceable teams
  = relevant repositories ÷ assumed repositories per team

high-fit teams
  = serviceable teams × assumed high-fit workflow share

annual revenue pool
  = high-fit teams × assumed annual team ARPA
```

## Scenario inputs

| Input | Low | Base | High |
| --- | ---: | ---: | ---: |
| Public LLM-SDK repositories | 1,100,000 | 1,100,000 | 1,100,000 |
| JavaScript/TypeScript share | 15% | 25% | 35% |
| Mature tool-using share | 20% | 30% | 50% |
| Repositories per team | 5 | 3 | 2 |
| High-fit workflow share | 30% | 50% | 60% |
| Annual team ARPA | US$2,400 | US$6,000 | US$12,000 |

## Scenario outputs

| Output | Low | Base | High |
| --- | ---: | ---: | ---: |
| Relevant repositories | 33,000 | 82,500 | 192,500 |
| Serviceable teams | 6,600 | 27,500 | 96,250 |
| High-fit teams | 1,980 | 13,750 | 57,750 |
| Annual revenue pool | US$4.752M | US$82.5M | US$693M |
| ARR at 1% capture | US$47,520 | US$825,000 | US$6.93M |

## Three-year capture sensitivity

Uses the base pool of 13,750 teams and base annual ARPA of US$6,000.

| Capture | Paying organizations | ARR |
| --- | ---: | ---: |
| 0.5% | 69 | US$412,500 |
| 2.0% | 275 | US$1,650,000 |
| 5.0% | 688 | US$4,125,000 |

The operating base case used in the report is 300 paying organizations × US$6,000 = US$1.8M ARR by year three. It is a target scenario, not a forecast.

## Point-in-time public signals

GitHub public Search API on 30 August 2026 returned:

- 866 repositories for topic `agent-evaluation`;
- 141 repositories for topic `agent-testing`;
- 86 TypeScript repositories for topic `agent-evaluation`;
- 2,111 repositories matching “AI agent testing” in README text.

npm downloads API for 23–29 August 2026 returned:

- `ai`: 23,560,904 downloads;
- `@langchain/core`: 5,686,219;
- `langchain`: 3,030,909;
- `@openai/agents`: 1,601,338;
- `@mastra/core`: 1,578,171.

Package downloads include CI, caching, mirrors and repeated installations. They are not unique users or organizations and must not be summed.

## Main uncertainties

1. Share of public LLM-SDK repositories that are TypeScript/Node agents rather than other LLM applications.
2. Share that actually calls tools and remains actively maintained.
3. Number of repositories belonging to the same commercial team.
4. Frequency and cost of behavioral regressions.
5. Which team capability — CI, history, collaboration or assurance — causes willingness to pay.
6. Actual annual contract value after a paid product exists.

The model should be refreshed when Ethogram can observe installs, activated projects, repeat runs, organization deduplication and price interviews.
