# The Title of the Book

*A bedtime story — this italic line is optional and gets skipped*

Part One: The First Chapter Title

The first paragraph of the story. Everything between blank lines becomes
ONE page in the reader — even if it wraps several lines in your editor.
A paragraph break is a page turn, so shape paragraphs like picture-book
beats: one to four sentences each.

The second paragraph. This is page 2.

"Dialogue works fine," said Bramble. This is page 3.

He said it anyway.

Part Two: The Next Chapter Title

The story continues here. Page numbering restarts inside each chapter.

> A CARVED WOODEN SIGN
> Line breaks inside a blockquote are kept — good for signs and notes.

**The End**

FORMAT RULES (this whole section is below "The End", so it never imports):

- TITLE: "# Heading" on line one, or a plain short first line. Override
  with --title "X".
- CHAPTERS: a line on its own reading "Part One: Name" (or "Chapter 1:
  Name"; "##" in front is fine). This is the ONLY chapter marker — a bare
  heading like "The End of the Day" will NOT split; write it as
  "Part Nine: The End of the Day".
- PAGES: one blank line between paragraphs = one page each. That is the
  entire pagination system.
- QUICK vs CHAPTER: no Part headings = quick story; any Part headings =
  chapter book. Auto-detected.
- FRONT MATTER: dedications, *italic lines*, "Target Age:" metadata
  blocks, and (for chapter books) everything before "Part One:" is
  skipped automatically.
- END: "**The End**" (or a Family Discussion / Reading Guide heading)
  stops the import.
- EMPHASIS: **bold** / *italic* markers are stripped; the words stay
  verbatim.
- .docx: export as plain text or markdown first.

WORKFLOW:
  1. Save the file in content/originals/
  2. npm run books:add -- --file my_story.md --dry-run   (preview)
  3. npm run books:add -- --file my_story.md              (write to pack)
  4. Commit + push — it deploys to the shelf.
  Flags: --title "X"  --id my-story  --by "Made by Mama"  --kind quick|chapter
  Re-running with the same --id updates text, keeps vocab/metadata.
