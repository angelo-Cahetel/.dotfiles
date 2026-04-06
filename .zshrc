
eval "$(starship init zsh)"

source <(fzf --zsh)

alias inv='nvim $(fzf -m --style full --preview="bat --color=always {}")'

alias ls='eza --color=always --long --git --no-filesize --icons=always --no-time --no-user --no-permissions'

alias reload-zsh="source ~/.zshrc"
alias edit-zsh="nvim ~/.zshrc"

alias python="python3"

# ---The Fuck ---
eval $(thefuck --alias)
eval $(thefuck --alias fk)

# -- Zoxide --
eval "$(zoxide init zsh)"
alias cd="z"

# Preview file content using bat (https://github.com/sharkdp/bat)
export FZF_CTRL_T_OPTS="
  --walker-skip .git,node_modules,target
  --preview 'eza --tree --color=always --icons=always --git-ignore {} | head -200'
  --style full"

  # CTRL-Y to copy the command into clipboard using pbcopy
export FZF_CTRL_R_OPTS="
  --bind 'ctrl-y:execute-silent(echo -n {2..} | pbcopy)+abort'
  --color header:italic
  --header 'Press CTRL-Y to copy command into clipboard'
  --style full
  "

  # Print tree structure in the preview window
export FZF_ALT_C_OPTS="
  --walker-skip .git,node_modules,target
  --preview 'eza --tree --color=always --icons=always --git-ignore {} | head -200'
  --style full
  "

 _fzf_comprun() {
  local command=$1
  shift

    case "$command" in 
      cd)           fzf --preview 'eza --tree --color=always {} | head -200' "$@" ;;
      export|unset)  fzf --preview "eval 'echo \$' {}"         "$@" ;;
      ssh)          fzf --preview 'dig {}'                   "$@" ;;
      *)            fzf --preview "--preview 'bat -n --color=always --line-range :500 {}'" "$@" ;;
    esac
  }

fastfetch

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# Autocomplete básico do zsh
autoload -Uz compinit
compinit

# Sugestões baseadas no histórico
source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh

