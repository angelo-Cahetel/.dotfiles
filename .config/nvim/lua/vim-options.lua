local opt = vim.opt

opt.number = true
opt.relativenumber = true
opt.termguicolors = true
opt.conceallevel = 0
opt.concealcursor = ""
vim.g.mapleader = " "

vim.cmd("filetype plugin indent on")

vim.o.winborder = "rounded"

-- tabs & indetation
opt.tabstop = 2
opt.softtabstop = 2
opt.shiftwidth = 2
opt.expandtab = true
opt.autoindent = true
opt.smartindent = true

opt.wrap = true
opt.linebreak = true
opt.textwidth = 80

opt.ignorecase = true
opt.smartcase = true

opt.cursorline = true

-- backspace
opt.backspace = "indent,eol,start"

-- clipboard
opt.clipboard:append("unnamedplus")

opt.splitright = true
opt.splitbelow = true

opt.swapfile = false

opt.colorcolumn = "0"
opt.signcolumn = "yes"
vim.o.cmdheight = 0

vim.api.nvim_create_autocmd("TextYankPost", {
  desc = "Highlight when yanking (copy) text",
  callback = function()
    vim.hl.on_yank()
  end,
})
