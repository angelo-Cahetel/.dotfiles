return {
	"rcarriga/nvim-notify",
	config = function()
		local notify = require("notify")

		require("telescope").load_extension("notify")

		notify.setup({
			stages = "fade",
			timeout = 4000,
			render = "default",
			max_width = 80,
			background_colour = "#000000",
		})

		-- Route all vim.notify calls through nvim-notify.
		vim.notify = notify

		vim.keymap.set("n", "<leader>m", ":Telescope notify<CR>", {})
	end,
}
