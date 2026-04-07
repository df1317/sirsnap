import { useEffect, useState, useMemo } from "react";
import {
	api,
	type Session,
	type Meeting,
	type AdminMeeting,
	type MeetingAttendance,
} from "../lib/api";
import { Layout } from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import { DataTable } from "../components/data-table";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import { Calendar } from "../components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "../components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { ChannelPicker } from "../components/ChannelPicker";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "../components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "../components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../components/ui/tabs";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus, Check, HelpCircle, X } from "lucide-react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatDate = (unix: number) =>
	new Date(unix * 1000).toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	}) +
	" · " +
	new Date(unix * 1000).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});

const fromUnix = (unix: number) => new Date(unix * 1000);
const toUnix = (d: Date) => Math.floor(d.getTime() / 1000);

function DatePicker({
	date,
	onSelect,
	placeholder = "Pick a date",
	className,
}: {
	date: Date | undefined;
	onSelect: (date: Date | undefined) => void;
	placeholder?: string;
	className?: string;
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					data-empty={!date}
					className={cn(
						"h-8 justify-start text-left font-normal text-xs data-[empty=true]:text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="size-3.5 mr-1.5 shrink-0" />
					{date ? format(date, "MMM d, yyyy") : <span>{placeholder}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar mode="single" selected={date} onSelect={onSelect} />
			</PopoverContent>
		</Popover>
	);
}

function CreateMeetingDialog({
	open,
	onClose,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	onCreated: (m: AdminMeeting) => void;
}) {
	const [name, setName] = useState("");
	const [desc, setDesc] = useState("");
	const [date, setDate] = useState<Date>();
	const [time, setTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [channel, setChannel] = useState("");
	const [creating, setCreating] = useState(false);

	const [isRecurring, setIsRecurring] = useState(false);
	const [selectedDays, setSelectedDays] = useState<number[]>([]);
	const [endDate, setEndDate] = useState<Date>();

	const toggleDay = (d: number) => {
		setSelectedDays((prev) =>
			prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
		);
	};

	const handleDateSelect = (newDate: Date | undefined) => {
		setDate(newDate);
		if (newDate && selectedDays.length === 0) {
			setSelectedDays([newDate.getDay()]);
		}
	};

	const handleCreate = async () => {
		if (!name.trim() || !date || !time) return;
		setCreating(true);
		try {
			const [hours, minutes] = time.split(":").map(Number);
			const dt = new Date(date);
			dt.setUTCHours(hours, minutes, 0, 0);
			const scheduledAt = toUnix(dt);

			let durationMinutes: number | undefined;
			let endUnix: number | undefined;
			if (endTime) {
				const [endHours, endMinutes] = endTime.split(":").map(Number);
				const endDt = new Date(date);
				endDt.setUTCHours(endHours, endMinutes, 0, 0);
				// Handle overnight meetings
				if (endDt < dt) {
					endDt.setDate(endDt.getDate() + 1);
				}
				endUnix = toUnix(endDt);
				durationMinutes = (endUnix - scheduledAt) / 60;
			}

			if (isRecurring && selectedDays.length > 0 && endDate) {
				const timeOfDayMinutes = hours * 60 + minutes;
				const endSeriesDt = new Date(endDate);
				endSeriesDt.setUTCHours(23, 59, 59, 0);
				const endSeriesUnix = toUnix(endSeriesDt);
				const created = await api.createMeetingSeries({
					name: name.trim(),
					description: desc.trim() || undefined,
					scheduled_at: scheduledAt,
					duration_minutes: durationMinutes,
					channel_id: channel || undefined,
					days_of_week: selectedDays,
					time_of_day_minutes: timeOfDayMinutes,
					end_date: endSeriesUnix,
				});
				onCreated(created);
			} else {
				const created = await api.createMeeting({
					name: name.trim(),
					description: desc.trim() || undefined,
					scheduled_at: scheduledAt,
					end_time: endUnix,
					channel_id: channel || undefined,
				});
				onCreated(created);
			}

			setName("");
			setDesc("");
			setDate(undefined);
			setTime("");
			setEndTime("");
			setChannel("");
			setIsRecurring(false);
			setSelectedDays([]);
			setEndDate(undefined);
			onClose();
		} finally {
			setCreating(false);
		}
	};

	const isValid =
		name.trim() &&
		date &&
		time &&
		(!endTime || endTime > time) &&
		(!isRecurring || (selectedDays.length > 0 && endDate));

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				if (!v) onClose();
			}}
		>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>New Meeting</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<div className="space-y-1.5">
						<label className="text-xs font-medium">
							Name <span className="text-destructive">*</span>
						</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Build Session"
							className="h-8 text-xs"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-xs font-medium">
							Description{" "}
							<span className="text-muted-foreground">(optional)</span>
						</label>
						<Textarea
							value={desc}
							onChange={(e) => setDesc(e.target.value)}
							placeholder="What's happening at this meeting?"
							className="text-xs min-h-16 resize-none"
							rows={3}
						/>
					</div>
					<div className="grid grid-cols-7 gap-3">
						<div className="space-y-1.5 flex flex-col col-span-3">
							<label className="text-xs font-medium">
								Date <span className="text-destructive">*</span>
							</label>
							<DatePicker
								date={date}
								onSelect={handleDateSelect}
								placeholder="Pick a date"
							/>
						</div>
						<div className="space-y-1.5 col-span-4">
							<label className="text-xs font-medium flex items-center justify-between">
								<span>
									Time <span className="text-destructive">*</span>
								</span>
							</label>
							<div className="flex items-center gap-1.5">
								<Input
									type="time"
									value={time}
									onChange={(e) => setTime(e.target.value)}
									className="h-8 flex-1 text-xs px-2"
								/>
								<span className="text-muted-foreground text-xs">-</span>
								<Input
									type="time"
									value={endTime}
									onChange={(e) => setEndTime(e.target.value)}
									className="h-8 flex-1 text-xs px-2"
								/>
							</div>
						</div>
					</div>
					<div className="space-y-1.5 flex flex-col">
						<label className="text-xs font-medium">
							Slack Channel{" "}
							<span className="text-muted-foreground">(for announcement)</span>
						</label>
						<ChannelPicker value={channel} onChange={setChannel} />
					</div>

					<Separator />

					<div className="space-y-2">
						<button
							type="button"
							className="flex items-center gap-2 text-xs font-medium cursor-pointer"
							onClick={() => setIsRecurring(!isRecurring)}
						>
							<div
								className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isRecurring ? "bg-primary border-primary" : "border-input"}`}
							>
								{isRecurring && (
									<span className="text-[10px] text-primary-foreground">✓</span>
								)}
							</div>
							Recurring meeting
						</button>

						{isRecurring && (
							<div className="space-y-4 pl-6 pt-2">
								<div className="space-y-1.5 flex flex-col">
									<label className="text-xs font-medium">
										Repeat on <span className="text-destructive">*</span>
									</label>
									<div className="flex gap-1.5">
										{DAY_LABELS.map((label, i) => (
											<button
												key={i}
												type="button"
												className={`w-9 h-8 rounded-md border text-[11px] font-medium transition-colors ${
													selectedDays.includes(i)
														? "bg-primary text-primary-foreground border-primary"
														: "bg-transparent border-input text-foreground hover:bg-muted/80"
												}`}
												onClick={() => toggleDay(i)}
											>
												{label}
											</button>
										))}
									</div>
								</div>
								<div className="space-y-1.5 flex flex-col">
									<label className="text-xs font-medium">
										End date <span className="text-destructive">*</span>
									</label>
									<DatePicker
										date={endDate}
										onSelect={setEndDate}
										placeholder="Pick end date"
									/>
								</div>
							</div>
						)}
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handleCreate}
						disabled={creating || !isValid}
					>
						{creating ? "Creating…" : "Create Meeting"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function EditMeetingDialog({
	meeting,
	onClose,
	onSaved,
}: {
	meeting: AdminMeeting;
	onClose: () => void;
	onSaved: (m: AdminMeeting) => void;
}) {
	const initial = fromUnix(meeting.scheduled_at);
	const [name, setName] = useState(meeting.name);
	const [desc, setDesc] = useState(meeting.description ?? "");
	const [date, setDate] = useState<Date>(initial);
	const [time, setTime] = useState(
		`${String(initial.getUTCHours()).padStart(2, "0")}:${String(initial.getUTCMinutes()).padStart(2, "0")}`,
	);
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		setSaving(true);
		try {
			let scheduledAt: number | undefined = undefined;
			if (date && time) {
				const [hours, minutes] = time.split(":").map(Number);
				const dt = new Date(date);
				dt.setUTCHours(hours, minutes, 0, 0);
				scheduledAt = toUnix(dt);
			}
			await api.updateMeeting(meeting.id, {
				name: name.trim() || undefined,
				description: desc.trim() || undefined,
				scheduled_at: scheduledAt,
			});
			onSaved({
				...meeting,
				name: name.trim() || meeting.name,
				description: desc.trim(),
				scheduled_at: scheduledAt ?? meeting.scheduled_at,
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog
			open={!!meeting}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Meeting</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<div className="space-y-1.5">
						<label className="text-xs font-medium">Name</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="h-8 text-xs"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-xs font-medium">Description</label>
						<Textarea
							value={desc}
							onChange={(e) => setDesc(e.target.value)}
							className="text-xs min-h-16 resize-none"
							rows={3}
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-xs font-medium">Date & Time</label>
						<div className="flex gap-2">
							<DatePicker
								date={date}
								onSelect={(d) => {
									if (d) setDate(d);
								}}
								placeholder="Pick a date"
								className="flex-1"
							/>
							<Input
								type="time"
								value={time}
								onChange={(e) => setTime(e.target.value)}
								className="h-8 w-28 text-xs"
							/>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button size="sm" onClick={handleSave} disabled={saving}>
						{saving ? "Saving…" : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function MeetingAttendanceDialog({
	meeting,
	onClose,
}: {
	meeting: AdminMeeting;
	onClose: () => void;
}) {
	const [attendance, setAttendance] = useState<MeetingAttendance[] | null>(
		null,
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.getMeetingAttendance(meeting.id)
			.then((data) => {
				setAttendance(data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [meeting.id]);

	return (
		<Sheet open={true} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="overflow-y-auto">
				<SheetHeader className="pb-0">
					<SheetTitle className="text-base">Attendance: {meeting.name}</SheetTitle>
				</SheetHeader>
				{loading ? (
					<div className="py-8 text-center text-sm text-muted-foreground">
						Loading attendance...
					</div>
				) : attendance && attendance.length > 0 ? (
					<div className="space-y-4 px-6 pt-6">
						{attendance.map((a) => (
							<div key={a.user_id} className="flex items-start gap-3">
								<Avatar className="size-8 mt-0.5">
									<AvatarImage src={a.avatar_url} />
									<AvatarFallback>{a.name.slice(0, 2)}</AvatarFallback>
								</Avatar>
								<div className="flex-1 space-y-1">
									<div className="flex items-center justify-between">
										<p className="text-sm font-medium leading-none">
											{a.name}
										</p>
										<div className="flex items-center text-xs">
											{a.status === "yes" && (
												<span className="text-emerald-600 flex items-center gap-1">
													<Check className="size-3" /> Yes
												</span>
											)}
											{a.status === "maybe" && (
												<span className="text-amber-600 flex items-center gap-1">
													<HelpCircle className="size-3" /> Maybe
												</span>
											)}
											{a.status === "no" && (
												<span className="text-red-600 flex items-center gap-1">
													<X className="size-3" /> No
												</span>
											)}
										</div>
									</div>
									{a.note && (
										<p className="text-sm text-muted-foreground bg-muted p-2 rounded-md mt-1">
											{a.note}
										</p>
									)}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="py-8 text-center text-sm text-muted-foreground">
						No RSVPs yet.
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}

function AdminMeetingsView() {
	const [meetings, setMeetings] = useState<AdminMeeting[]>([]);
	const [createOpen, setCreateOpen] = useState(false);
	const [editMeeting, setEditMeeting] = useState<AdminMeeting | null>(null);
	const [viewAttendanceMeeting, setViewAttendanceMeeting] =
		useState<AdminMeeting | null>(null);
	const [selectedMeetings, setSelectedMeetings] = useState<AdminMeeting[]>([]);
	const now = Math.floor(Date.now() / 1000);

	useEffect(() => {
		api.getAdminMeetings().then(setMeetings);
	}, []);

	const handleCancel = async (m: AdminMeeting) => {
		const newVal = !m.cancelled;
		setMeetings((prev) =>
			prev.map((x) => (x.id === m.id ? { ...x, cancelled: newVal } : x)),
		);
		await api.cancelMeeting(m.id, newVal).catch(() => {
			setMeetings((prev) =>
				prev.map((x) => (x.id === m.id ? { ...x, cancelled: m.cancelled } : x)),
			);
		});
	};

	const handleDelete = async (id: number) => {
		await api.deleteMeeting(id);
		setMeetings((prev) => prev.filter((x) => x.id !== id));
	};

	// Use useMemo to prevent recreating the columns array on every render
	// which prevents the DataTable and underlying images from re-rendering
	const columns = useMemo<ColumnDef<AdminMeeting, unknown>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Name",
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<span className="font-medium">{row.original.name}</span>
						{row.original.series_id && (
							<Badge variant="secondary" className="text-[10px] px-1.5 py-0">
								Series
							</Badge>
						)}
					</div>
				),
			},
			{
				id: "date",
				header: "Date",
				accessorFn: (row) => row.scheduled_at,
				cell: ({ row }) => {
					const m = row.original;
					let timeStr = formatDate(m.scheduled_at);
					if (m.end_time) {
						const endDt = new Date(m.end_time * 1000);
						timeStr += ` - ${endDt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
					}
					return (
						<span className="text-muted-foreground whitespace-nowrap">
							{timeStr}
						</span>
					);
				},
			},
			{
				id: "status",
				header: "Status",
				accessorFn: (row) => (row.cancelled ? 0 : row.scheduled_at),
				cell: ({ row }) => {
					const m = row.original;
					if (m.cancelled) return <Badge variant="destructive">Cancelled</Badge>;
					if (m.scheduled_at < now)
						return <Badge variant="secondary">Past</Badge>;
					return <Badge variant="outline">Upcoming</Badge>;
				},
			},
			{
				id: "rsvp",
				header: "RSVP",
				cell: ({ row }) => {
					const m = row.original;
					return (
						<div className="flex items-center gap-0.5 text-xs text-muted-foreground">
							<span className="text-emerald-600">{m.yes_count}</span>
							<span className="mx-0.5">/</span>
							<span className="text-amber-600">{m.maybe_count}</span>
							<span className="mx-0.5">/</span>
							<span className="text-red-600">{m.no_count}</span>
						</div>
					);
				},
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => {
					const m = row.original;
					return (
						<div
							className="flex items-center gap-1"
							onClick={(e) => e.stopPropagation()}
						>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => setEditMeeting(m)}
							>
								<Pencil className="size-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2 text-xs"
								onClick={() => handleCancel(m)}
							>
								{m.cancelled ? "Restore" : "Cancel"}
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								className="text-destructive hover:text-destructive"
								onClick={() => handleDelete(m.id)}
							>
								<Trash2 className="size-3.5" />
							</Button>
						</div>
					);
				},
			},
		],
		[now],
	);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-xs text-muted-foreground">
						{meetings.length} meetings
					</span>
					{selectedMeetings.length > 0 && (
						<>
							<Separator orientation="vertical" className="h-4" />
							<span className="text-xs text-muted-foreground">
								{selectedMeetings.length} selected
							</span>
						</>
					)}
				</div>
				<div className="flex items-center gap-2">
					{selectedMeetings.length > 0 && (
						<Button
							size="sm"
							variant="destructive"
							onClick={() => {
								for (const m of selectedMeetings) {
									handleDelete(m.id);
								}
								setSelectedMeetings([]);
							}}
						>
							<Trash2 className="size-3.5 mr-1" />
							Delete Selected
						</Button>
					)}
					<Button size="sm" onClick={() => setCreateOpen(true)}>
						<Plus className="size-3.5 mr-1" />
						New Meeting
					</Button>
				</div>
			</div>
			<DataTable
				columns={columns}
				data={meetings}
				filterPlaceholder="Filter meetings…"
				onRowClick={(m) => setViewAttendanceMeeting(m)}
				enableRowSelection
				onSelectionChange={setSelectedMeetings}
			/>

			<CreateMeetingDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				onCreated={(m) => setMeetings((prev) => [m, ...prev])}
			/>

			{editMeeting && (
				<EditMeetingDialog
					meeting={editMeeting}
					onClose={() => setEditMeeting(null)}
					onSaved={(m) =>
						setMeetings((prev) => prev.map((x) => (x.id === m.id ? m : x)))
					}
				/>
			)}

			{viewAttendanceMeeting && (
				<MeetingAttendanceDialog
					meeting={viewAttendanceMeeting}
					onClose={() => setViewAttendanceMeeting(null)}
				/>
			)}
		</div>
	);
}

function UpcomingMeetingsView({
	meetings,
	onUpdate,
}: {
	meetings: Meeting[];
	onUpdate: (id: number, status: Meeting["my_status"], note: string) => void;
}) {
	const [selectedMeetings, setSelectedMeetings] = useState<Meeting[]>([]);
	const [bulkStatus, setBulkStatus] = useState<"yes" | "maybe" | "no" | null>(null);
	const [saving, setSaving] = useState(false);

	const handleBulkUpdate = async () => {
		if (!bulkStatus || selectedMeetings.length === 0 || saving) return;
		setSaving(true);
		try {
			await Promise.all(
				selectedMeetings.map((m) => api.rsvp(m.id, bulkStatus, ""))
			);
			for (const m of selectedMeetings) {
				onUpdate(m.id, bulkStatus, "");
			}
			setSelectedMeetings([]);
			setBulkStatus(null);
		} finally {
			setSaving(false);
		}
	};

	const columns = useMemo<ColumnDef<Meeting, unknown>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Name",
				cell: ({ row }) => (
					<div className="flex flex-col">
						<span className="font-medium">{row.original.name}</span>
						{row.original.description && (
							<span className="text-xs text-muted-foreground truncate max-w-[200px]">
								{row.original.description}
							</span>
						)}
					</div>
				),
			},
			{
				id: "date",
				header: "Date",
				accessorFn: (row) => row.scheduled_at,
				cell: ({ row }) => {
					const m = row.original;
					let timeStr = formatDate(m.scheduled_at);
					if (m.end_time) {
						const endDt = new Date(m.end_time * 1000);
						timeStr += ` - ${endDt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
					}
					return (
						<span className="text-muted-foreground whitespace-nowrap">
							{timeStr}
						</span>
					);
				},
			},
			{
				id: "rsvp",
				header: "RSVP",
				cell: ({ row }) => {
					const m = row.original;
					return (
						<div className="flex items-center gap-0.5 text-xs text-muted-foreground">
							<span className="text-emerald-600">{m.yes_count || 0}</span>
							<span className="mx-0.5">/</span>
							<span className="text-amber-600">{m.maybe_count || 0}</span>
							<span className="mx-0.5">/</span>
							<span className="text-red-600">{m.no_count || 0}</span>
						</div>
					);
				},
			},
			{
				id: "my_status",
				header: "My Status",
				cell: ({ row }) => {
					const m = row.original;
					return (
						<div className="flex items-center gap-2">
							<div className="flex gap-1">
								{(["yes", "maybe", "no"] as const).map((s) => {
									const labels = { yes: "Going", maybe: "Maybe", no: "Can't go" };
									return (
										<Button
											key={s}
											size="sm"
											variant={m.my_status === s ? "default" : "outline"}
											className="h-6 px-2 text-[10px]"
											onClick={async (e) => {
												e.stopPropagation();
												await api.rsvp(m.id, s, m.my_note ?? "");
												onUpdate(m.id, s, m.my_note ?? "");
											}}
										>
											{labels[s]}
										</Button>
									);
								})}
							</div>
							{m.my_note && (
								<span className="text-xs text-muted-foreground italic truncate max-w-[100px]" title={m.my_note}>
									"{m.my_note}"
								</span>
							)}
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
										<Pencil className="size-3" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-64 p-3" onClick={(e) => e.stopPropagation()}>
									<div className="space-y-2">
										<h4 className="text-xs font-medium">Note for {m.name}</h4>
										<Textarea
											id={`note-${m.id}`}
											defaultValue={m.my_note ?? ""}
											className="text-xs resize-none"
											rows={2}
											placeholder="Add a note..."
										/>
										<div className="flex justify-end">
											<Button size="sm" onClick={async () => {
												const val = (document.getElementById(`note-${m.id}`) as HTMLTextAreaElement).value;
												await api.rsvp(m.id, m.my_status || "yes", val);
												onUpdate(m.id, m.my_status || "yes", val);
											}}>Save</Button>
										</div>
									</div>
								</PopoverContent>
							</Popover>
						</div>
					);
				},
			},
		],
		[onUpdate]
	);

	return (
		<div className="space-y-4">
			{selectedMeetings.length > 0 && (
				<Card className="bg-muted/30 border-primary/20">
					<CardContent className="p-3 flex items-center justify-between gap-4">
						<span className="text-sm font-medium">
							{selectedMeetings.length} meetings selected
						</span>
						<div className="flex items-center gap-2 flex-1 max-w-md">
							<div className="flex gap-1 shrink-0">
								{(["yes", "maybe", "no"] as const).map((s) => {
									const labels = { yes: "Going", maybe: "Maybe", no: "Can't go" };
									return (
										<Button
											key={s}
											size="sm"
											variant={bulkStatus === s ? "default" : "outline"}
											className="h-8 text-xs"
											onClick={() => setBulkStatus(s)}
										>
											{labels[s]}
										</Button>
									);
								})}
							</div>
							<Button
								size="sm"
								onClick={handleBulkUpdate}
								disabled={!bulkStatus || saving}
								className="h-8 ml-auto"
							>
								{saving ? "Saving…" : "Apply"}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
			<DataTable
				columns={columns}
				data={meetings}
				filterPlaceholder="Filter upcoming meetings…"
				enableRowSelection
				onSelectionChange={setSelectedMeetings}
			/>
		</div>
	);
}

function PastMeetingsView({ isAdmin }: { isAdmin: boolean }) {
	const [meetings, setMeetings] = useState<Meeting[]>([]);
	const [loading, setLoading] = useState(true);
	const [viewAttendanceMeeting, setViewAttendanceMeeting] = useState<AdminMeeting | null>(null);

	useEffect(() => {
		api.getPastMeetings().then((data) => {
			setMeetings(data);
			setLoading(false);
		});
	}, []);

	const columns = useMemo<ColumnDef<Meeting, unknown>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Name",
				cell: ({ row }) => (
					<div className="flex flex-col">
						<span className="font-medium">{row.original.name}</span>
						{row.original.description && (
							<span className="text-xs text-muted-foreground truncate max-w-[200px]">
								{row.original.description}
							</span>
						)}
					</div>
				),
			},
			{
				id: "date",
				header: "Date",
				accessorFn: (row) => row.scheduled_at,
				cell: ({ row }) => {
					const m = row.original;
					let timeStr = formatDate(m.scheduled_at);
					if (m.end_time) {
						const endDt = new Date(m.end_time * 1000);
						timeStr += ` - ${endDt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
					}
					return (
						<span className="text-muted-foreground whitespace-nowrap">
							{timeStr}
						</span>
					);
				},
			},
			{
				id: "rsvp",
				header: "RSVP",
				cell: ({ row }) => {
					const m = row.original;
					return (
						<div className="flex items-center gap-0.5 text-xs text-muted-foreground">
							<span className="text-emerald-600">{m.yes_count || 0}</span>
							<span className="mx-0.5">/</span>
							<span className="text-amber-600">{m.maybe_count || 0}</span>
							<span className="mx-0.5">/</span>
							<span className="text-red-600">{m.no_count || 0}</span>
						</div>
					);
				},
			},
			{
				id: "my_status",
				header: "My Status & Note",
				cell: ({ row }) => {
					const m = row.original;
					if (!m.my_status) return <span className="text-muted-foreground text-xs italic">Did not RSVP</span>;
					
					const labels = { yes: "Going", maybe: "Maybe", no: "Can't go" };
					const colors = { 
						yes: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50", 
						maybe: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50", 
						no: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50" 
					};
					
					return (
						<div className="flex items-center gap-2">
							<Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${colors[m.my_status]}`}>
								{labels[m.my_status]}
							</Badge>
							{m.my_note && (
								<span className="text-xs text-muted-foreground italic truncate max-w-[150px]" title={m.my_note}>
									"{m.my_note}"
								</span>
							)}
						</div>
					);
				},
			},
		],
		[]
	);

	if (loading) {
		return <div className="text-sm text-muted-foreground py-8 text-center">Loading past meetings...</div>;
	}

	if (meetings.length === 0) {
		return <p className="text-sm text-muted-foreground py-4">No past meetings.</p>;
	}

	return (
		<div className="space-y-4">
			<DataTable
				columns={columns}
				data={meetings}
				filterPlaceholder="Filter past meetings…"
				onRowClick={isAdmin ? (m) => setViewAttendanceMeeting(m as unknown as AdminMeeting) : undefined}
			/>
			{viewAttendanceMeeting && (
				<MeetingAttendanceDialog
					meeting={viewAttendanceMeeting}
					onClose={() => setViewAttendanceMeeting(null)}
				/>
			)}
		</div>
	);
}

export function MeetingsPage({ session }: { session: Session }) {
	const [meetings, setMeetings] = useState<Meeting[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const cached = sessionStorage.getItem("meetings_cache");
		if (cached) {
			setMeetings(JSON.parse(cached));
			setLoading(false);
		}

		api.getMeetings().then((m) => {
			setMeetings(m);
			sessionStorage.setItem("meetings_cache", JSON.stringify(m));
			setLoading(false);
		});
	}, [session.is_admin]);

	const updateRsvp = (id: number, status: Meeting["my_status"], note: string) => {
		const updateList = (list: Meeting[]) => {
			return list.map((m) => {
				if (m.id === id) {
					// We use m.my_status as the prevStatus to avoid stale closures
					const prevStatus = m.my_status;
					
					// Optimistically update counts
					let yes_count = m.yes_count;
					let maybe_count = m.maybe_count;
					let no_count = m.no_count;

					if (prevStatus === "yes") yes_count = Math.max(0, yes_count - 1);
					if (prevStatus === "maybe") maybe_count = Math.max(0, maybe_count - 1);
					if (prevStatus === "no") no_count = Math.max(0, no_count - 1);

					if (status === "yes") yes_count += 1;
					if (status === "maybe") maybe_count += 1;
					if (status === "no") no_count += 1;

					return { ...m, my_status: status, my_note: note, yes_count, maybe_count, no_count };
				}
				return m;
			});
		};
		setMeetings((ms) => updateList(ms));
	};

	const now = Math.floor(Date.now() / 1000);
	const upcoming = meetings
		.filter((m) => (m.end_time || m.scheduled_at) > now)
		.sort((a, b) => a.scheduled_at - b.scheduled_at);

	if (loading)
		return (
			<Layout session={session}>
				<div className="space-y-6 animate-pulse">
					<div className="space-y-1.5">
						<div className="h-6 w-24 bg-muted rounded"></div>
						<div className="h-4 w-48 bg-muted rounded"></div>
					</div>
					<div className="h-9 w-64 bg-muted rounded-md mt-4 mb-8"></div>
					<div className="border rounded-md overflow-hidden bg-card">
						<div className="h-10 border-b bg-muted/30"></div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14 border-b">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
						<div className="flex items-center gap-4 p-4 h-14">
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/4 bg-muted rounded"></div>
							<div className="h-4 w-1/3 bg-muted rounded"></div>
						</div>
					</div>
				</div>
			</Layout>
		);

	const renderMeetingsList = () => (
		<div className="space-y-8">
			<div>
				{upcoming.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No upcoming meetings.
					</p>
				) : (
					<UpcomingMeetingsView meetings={upcoming} onUpdate={updateRsvp} />
				)}
			</div>
		</div>
	);

	return (
		<Layout session={session}>
			<div className="space-y-4">
				<div>
					<h1 className="text-lg font-semibold tracking-tight">Meetings</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						RSVP to upcoming meetings.
					</p>
				</div>

				<Tabs defaultValue="upcoming">
					<TabsList>
						<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
						<TabsTrigger value="past">Past</TabsTrigger>
						{session.is_admin && <TabsTrigger value="manage">Manage</TabsTrigger>}
					</TabsList>
					<TabsContent value="upcoming" className="mt-4">
						{renderMeetingsList()}
					</TabsContent>
					<TabsContent value="past" className="mt-4">
						<PastMeetingsView isAdmin={session.is_admin} />
					</TabsContent>
					{session.is_admin && (
						<TabsContent value="manage" className="mt-4">
							<AdminMeetingsView />
						</TabsContent>
					)}
				</Tabs>
			</div>
		</Layout>
	);
}
