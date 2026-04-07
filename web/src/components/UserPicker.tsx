import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, type User } from "../lib/api";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function UserPicker({
	selectedIds = [],
	selectedUsers = [],
	onToggle,
	onClear,
	filter,
	className,
}: {
	selectedIds?: string[];
	selectedUsers?: User[];
	onToggle: (user: User, isSelected: boolean) => void;
	onClear?: () => void;
	filter?: (user: User) => boolean;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [users, setUsers] = useState<User[]>([]);
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (users.length === 0) {
			api.getUsers().then(setUsers);
		}
	}, [users.length]);

	useEffect(() => {
		if (open && inputRef.current) inputRef.current.focus();
	}, [open]);

	const filtered = users
		.filter(
			(u) =>
				(!filter || filter(u)) &&
				u.name.toLowerCase().includes(query.toLowerCase()),
		)
		.sort((a, b) => {
			const aSelected = selectedIds.includes(a.user_id);
			const bSelected = selectedIds.includes(b.user_id);
			if (aSelected && !bSelected) return -1;
			if (!aSelected && bSelected) return 1;
			return a.name.localeCompare(b.name);
		});

	const displayUsers =
		selectedUsers.length > 0
			? selectedUsers
			: users.filter((u) => selectedIds.includes(u.user_id));

	const toggleUser = (user: User) => {
		const isSelected = selectedIds.includes(user.user_id);
		onToggle(user, !isSelected);
		if (inputRef.current) inputRef.current.focus();
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"flex h-auto min-h-9 w-full justify-start whitespace-normal rounded-md border border-input bg-transparent px-3 py-1.5 text-left font-normal text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[empty=true]:text-muted-foreground",
						className,
					)}
				>
					{displayUsers.length > 0 ? (
						<div className="relative flex w-full flex-wrap items-center gap-1.5 pr-8">
							<div className="mr-1 flex -space-x-1.5 overflow-hidden">
								{displayUsers.slice(0, 3).map((u) => (
									<Avatar
										key={u.user_id}
										className="inline-block size-5 ring-1 ring-background"
									>
										<AvatarImage src={u.avatar_url} />
										<AvatarFallback className="text-[8px]">
											{u.name[0]}
										</AvatarFallback>
									</Avatar>
								))}
							</div>
							<span className="max-w-[120px] truncate text-xs">
								{displayUsers
									.slice(0, 2)
									.map((u) => u.name)
									.join(", ")}
							</span>
							{displayUsers.length > 2 && (
								<span className="whitespace-nowrap text-muted-foreground text-xs">
									+{displayUsers.length - 2} more
								</span>
							)}
							{onClear && (
								<button
									type="button"
									className="absolute top-1/2 right-0 -translate-y-1/2 cursor-pointer rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									onClick={(e) => {
										e.stopPropagation();
										onClear();
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.stopPropagation();
											onClear();
										}
									}}
								>
									<X className="size-3.5" />
								</button>
							)}
						</div>
					) : (
						<span className="text-muted-foreground">Select members…</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="pointer-events-auto w-64 p-0"
				align="start"
				onWheel={(e) => e.stopPropagation()}
			>
				<div className="p-1">
					<Input
						ref={inputRef}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search members…"
						className="mb-1 h-8 text-xs"
					/>
					<div className="max-h-[200px] overflow-y-auto overscroll-contain">
						{filtered.length === 0 && (
							<p className="px-2 py-1.5 text-muted-foreground text-xs">
								No members found.
							</p>
						)}
						{filtered.map((u) => {
							const isSelected = selectedIds.includes(u.user_id);
							return (
								<button
									key={u.user_id}
									type="button"
									className={cn(
										"flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors",
										isSelected ? "bg-accent/50" : "hover:bg-muted",
									)}
									onClick={() => toggleUser(u)}
								>
									<div className="flex items-center gap-2 overflow-hidden">
										<Avatar size="sm" className="size-4 shrink-0">
											<AvatarImage src={u.avatar_url} />
											<AvatarFallback className="text-[8px]">
												{u.name[0]}
											</AvatarFallback>
										</Avatar>
										<span className="truncate">{u.name}</span>
									</div>
									{isSelected && (
										<Check className="size-3.5 shrink-0 text-primary" />
									)}
								</button>
							);
						})}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
