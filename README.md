<div align="center">
  <h1>codemap</h1>
  <p>A Node.js script that converts entire codebases into a single Markdown file, optimized for LLM context.</p>
</div>

<br>

![](https://i.imgur.com/kStMysx.png)

## Unlock the Power of LLMs

Have you ever tried to ask a question about a large project to a LLM? It can be a frustrating experience. You can't just paste the entire codebase, and explaining the architecture takes time.

This script solves that problem by creating a single, comprehensive Markdown file that you can easily share with an LLM. This provides the model with the necessary context to understand your project's structure, dependencies, and code, leading to more relevant and accurate answers.

![](https://i.imgur.com/kStMysx.png)

## Features

-  **Recursive Traversal:** Automatically walks through the directory structure.
-  **Content Aggregation:** Reads and appends the content of each file.
-  **Ignore Patterns:** Skips specified directories and files (configured in `ignore.json`).
-  **Customizable Output:** Specify an output file or let the script create one in your Downloads folder.
-  **Clear Formatting:** Each file's content is clearly marked with its path and enclosed in a code block.

<br>

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sebasxs/codemap.git
   ```
2. Navigate to the project directory:
   ```bash
   cd codemap
   ```
3. Install the package globally:
   ```bash
   npm install -g .
   ```
   This will make the `codemap` command available in your system.

## Usage

Once installed, you can run the `codemap` command from your terminal.

```bash
codemap <inputPath> [outputPath]
```

-  `<inputPath>`: (Required) The path to the directory you want to export.
-  `[outputPath]`: (Optional) The path where the final Markdown file will be saved. If not provided, it defaults to your Downloads folder.

### Example

```bash
# Export the 'my-project' directory to a markdown file
codemap ./my-project
```

Now you can open the `my-project.md` file and paste its content into your LLM of choice.

## License

This project is licensed under the ISC License.
