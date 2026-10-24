# Prompt Optimization for Nyare

This guide covers prompt evaluation and token reduction for Nyare AI services.

## Token Optimization Techniques

### 1. XML Tags with Tabular CSV
Do not pass JSON arrays in prompt inputs.
Pass CSV tables wrapped in semantic XML tags:

```text
<journal_notes>
note_ref,course,content
n1,CS101,"Read chapter 3 before next Tuesday"
</journal_notes>
```

CSV reduces input token consumption by up to 40% compared to nested JSON.

### 2. Stub Reference Identifiers
Use `StubReferenceCodec` to encode UUIDs into compact tokens (`n1`, `n2`, `i1`).
Decode references after receiving the model response.
This saves tokens and prevents the model from mangling long UUID strings.

## Testing Prompts with Spring AI

Use JUnit 5 to test prompt extraction accuracy without calling remote APIs:

```java
@Test
void extractsTasksWithoutHallucinatedDeadlines() {
    ChatClient mockClient = mock(ChatClient.class);
    // verify prompt contains temporal anchor and valid CSV
}
```