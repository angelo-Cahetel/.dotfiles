return {
	"stevearc/conform.nvim",
	event = { "BufReadPre", "BufNewFile" },
	config = function()
		require("conform").setup({
			formatters_by_ft = {
				lua = { "stylua" },
				python = { "ruff_format" },
				javascript = { "prettier" },
				typescriptreact = { "prettier" },
			},
			format_on_save = { timeout_ms = 500, lsp_fallback = true },
		})
	end,
}
