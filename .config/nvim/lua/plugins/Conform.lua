return {
	"stevearc/conform.nvim",
	event = { "BufReadPre", "BufNewFile" },
	config = function()
		local conform = require("conform")

		conform.setup({
			formatters_by_ft = {
				lua = { "stylua" },
				python = { "ruff_format" },
				go = { "goimports", "gofmt" },
				javascript = { "prettier" },
				typescript = { "prettier" },
				javascriptreact = { "prettier" },
				typescriptreact = { "prettier" },
				css = { "prettier" },
				scss = { "prettier" },
				html = { "prettier" },
				json = { "prettier" },
				yaml = { "prettier" },
				markdown = { "prettier" },
				svelte = { "prettier" },
			},
			format_on_save = { timeout_ms = 500, lsp_fallback = true },
		})

		vim.keymap.set("n", "<leader>gf", function()
			conform.format({ async = true, lsp_fallback = true })
		end, { desc = "Format current buffer" })
	end,
}
