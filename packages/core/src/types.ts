export type Signals =
	| 'SIGABRT'
	| 'SIGALRM'
	| 'SIGBUS'
	| 'SIGCHLD'
	| 'SIGCONT'
	| 'SIGFPE'
	| 'SIGHUP'
	| 'SIGILL'
	| 'SIGINT'
	| 'SIGIO'
	| 'SIGIOT'
	| 'SIGKILL'
	| 'SIGPIPE'
	| 'SIGPOLL'
	| 'SIGPROF'
	| 'SIGPWR'
	| 'SIGQUIT'
	| 'SIGSEGV'
	| 'SIGSTKFLT'
	| 'SIGSTOP'
	| 'SIGSYS'
	| 'SIGTERM'
	| 'SIGTRAP'
	| 'SIGTSTP'
	| 'SIGTTIN'
	| 'SIGTTOU'
	| 'SIGUNUSED'
	| 'SIGURG'
	| 'SIGUSR1'
	| 'SIGUSR2'
	| 'SIGVTALRM'
	| 'SIGWINCH'
	| 'SIGXCPU'
	| 'SIGXFSZ'
	| 'SIGBREAK'
	| 'SIGLOST'
	| 'SIGINFO';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LocalVars {}

export interface LocalVarsContainer {
	locals: LocalVars;
}
