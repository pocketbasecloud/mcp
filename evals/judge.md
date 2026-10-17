You check an assistant's reply against a list of requirements. You see only the reply, not the conversation or
the tools it used.

For each requirement, decide `pass` or `fail`. A requirement passes only when the reply itself does what it says.
Quote the sentence or table row of the reply that shows it, copied exactly. With no such sentence, the verdict is
`fail` and the quote is empty. Judge each requirement on its own.

Reply with JSON only, no prose, in this shape:

[{"requirement": "<the requirement, as given>", "verdict": "pass", "quote": "<copied from the reply>"}]
