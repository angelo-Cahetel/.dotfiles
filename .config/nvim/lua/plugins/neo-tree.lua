return {
	"nvim-neo-tree/neo-tree.nvim",
	branch = "v3.x",
	dependencies = {
		"nvim-lua/plenary.nvim",
		"nvim-tree/nvim-web-devicons",
		"MunifTanjim/nui.nvim",
	},
	config = function()
		require("neo-tree").setup({
			use_popups_for_input = false,
			window = {
				highlights = {
					normal = "NormalNC",
					normalnc = "NormalNC",
				},
			},
			filesystem = {
				filtered_items = {
					visible = false,
					hide_dotfiles = false,
					hide_gitignored = true,
					hide_hidden = true,
					show_hidden_count = false,
					never_show = {
						".DS_Store",
					},
				},
			},
			default_component_configs = {
				hidden_file = {
					enabled = false,
				},
			},
		})
		vim.keymap.set("n", "<leader>b", ":Neotree filesystem toggle left<CR>", {})
		vim.keymap.set("n", "<C-b>", ":Neotree filesystem reveal left<CR>", {})
	end,
}
