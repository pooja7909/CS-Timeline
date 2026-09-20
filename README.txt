UPDATED CURRICULUM APP FILES

1. App.tsx
   - Fixes the Holiday/Break Category Badge (tag) save/display bug.
   - The BreakModal now receives the correct props and returns the selected term, updated break and position correctly.
   - Existing Firestore-only persistence is preserved.

2. MatrixView.tsx
   - Adds a Mark complete / Done control for each lesson cell.
   - Completed lessons use a soft green background and green border.
   - Lesson text is NOT struck through.
   - Clicking Done again marks the lesson incomplete.
   - taught state is saved through the existing Firestore persistence handler.

3. BreakModal.tsx
   - Included for completeness; its existing Category Badge field is retained.

Replace App.tsx and src/components/MatrixView.tsx in GitHub.
The full project folder is also included in the ZIP.
