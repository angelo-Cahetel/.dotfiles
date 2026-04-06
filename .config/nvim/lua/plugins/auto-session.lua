return {
	"rmagatti/auto-session",
	config = function()
		require("auto-session").setup({
			auto_session_suppress_dirs = { "~/", "~/Projects", "~/Downloads/", "/" },
			session_lens = {
				buftypes_to_ignore = {},
				load_on_setup = true,
				theme_conf = { border = true },
				previewer = false,
			},
		})

		vim.keymap.set("n", "<leader>ls", "<cmd>AutoSession search<CR>", {
			noremap = true,
			silent = true,
			desc = "Search sessions",
		})
		vim.keymap.set("i", "<C-d>", "<cmd>AutoSession delete<CR>", {})
	end,
}
