"use client";

import { useMemo, useState } from "react";
import {
  Activity, ArrowDownWideNarrow, CalendarDays, Check, CheckCircle2, Circle,
  ClipboardList, LayoutDashboard, ListTodo, Plus, Search, Settings2, Trash2,
  X
} from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";

type Filter = "all" | TaskStatus;

const statusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Completed"
};

function formatDate(date: string) {
  if (!date) return "No due date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export function TaskDashboard() {
  const { tasks, isReady, addTask, deleteTask, setStatus } = useTasks();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesFilter = filter === "all" || task.status === filter;
      const matchesQuery = !normalizedQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [tasks, filter, query]);

  const counts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter((task) => task.status === "todo").length,
    active: tasks.filter((task) => task.status === "in-progress").length,
    done: tasks.filter((task) => task.status === "done").length
  }), [tasks]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    addTask({ title: cleanTitle, description: description.trim(), priority, dueDate });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setShowForm(false);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="TaskFlow home">
          <span className="brand-mark"><Check size={19} strokeWidth={3} /></span>
          <span>taskflow</span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          <a className="nav-item active" href="#"><LayoutDashboard size={18} /> Overview</a>
          <a className="nav-item" href="#tasks"><ListTodo size={18} /> My tasks <span className="nav-count">{counts.all}</span></a>
          <a className="nav-item" href="#activity"><Activity size={18} /> Activity</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon"><ClipboardList size={18} /></div>
            <strong>Small steps, big progress.</strong>
            <p>Keep your focus on what matters today.</p>
          </div>
          <a className="nav-item muted" href="#settings"><Settings2 size={18} /> Settings</a>
          <div className="profile">
            <div className="avatar">JD</div>
            <div><strong>Jordan Davis</strong><span>Personal workspace</span></div>
            <span className="profile-dots">···</span>
          </div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div>
          <div className="topbar-right"><span className="today-label"><CalendarDays size={15} /> Monday, November 16</span><div className="avatar small">JD</div></div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
              <h1>Good morning, Jordan <span>✦</span></h1>
              <p className="subtitle">Here&apos;s what&apos;s happening with your tasks today.</p>
            </div>
            <button className="primary-button" onClick={() => setShowForm(true)}><Plus size={18} /> New task</button>
          </section>

          <section className="stats-grid" aria-label="Task summary">
            <StatCard label="Total tasks" value={counts.all} helper="Across your workspace" icon={<ClipboardList size={18} />} tone="violet" />
            <StatCard label="To do" value={counts.todo} helper="Waiting to get started" icon={<Circle size={18} />} tone="blue" />
            <StatCard label="In progress" value={counts.active} helper="Currently being worked on" icon={<Activity size={18} />} tone="orange" />
            <StatCard label="Completed" value={counts.done} helper="Great work so far" icon={<CheckCircle2 size={18} />} tone="green" />
          </section>

          <section className="tasks-panel" id="tasks">
            <div className="panel-heading">
              <div><h2>Your tasks</h2><p>Manage and prioritize your work.</p></div>
              <div className="task-tools">
                <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." aria-label="Search tasks" /></label>
                <button className="icon-button" title="Sort tasks by due date" onClick={() => setFilter("all")}><ArrowDownWideNarrow size={17} /></button>
              </div>
            </div>
            <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
              {(["all", "todo", "in-progress", "done"] as Filter[]).map((item) => (
                <button key={item} role="tab" aria-selected={filter === item} className={`filter-tab ${filter === item ? "selected" : ""}`} onClick={() => setFilter(item)}>
                  {item === "all" ? "All tasks" : statusLabels[item]}
                  <span>{item === "all" ? counts.all : item === "todo" ? counts.todo : item === "in-progress" ? counts.active : counts.done}</span>
                </button>
              ))}
            </div>

            {!isReady ? <div className="empty-state">Loading your tasks...</div> : filteredTasks.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><ListTodo size={22} /></div><strong>No tasks found</strong><p>Try another search or create a new task.</p><button className="text-button" onClick={() => setShowForm(true)}>Create a task</button></div>
            ) : (
              <div className="task-list">
                {filteredTasks.map((task) => <TaskRow key={task.id} task={task} onStatusChange={setStatus} onDelete={deleteTask} />)}
              </div>
            )}
            <div className="panel-footer"><span>Showing {filteredTasks.length} of {tasks.length} tasks</span><span>Saved automatically on this device</span></div>
          </section>
          <footer className="page-footer">Made for focused work <span>·</span> TaskFlow demo</footer>
        </div>
      </section>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-header"><div><p className="eyebrow">MAKE IT HAPPEN</p><h2 id="modal-title">Create a new task</h2></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close dialog"><X size={18} /></button></div>
            <form onSubmit={handleSubmit}>
              <label className="field-label">Task name <span>*</span><input autoFocus required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Prepare project proposal" /></label>
              <label className="field-label">Description <textarea rows={3} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a few details (optional)" /></label>
              <div className="form-row">
                <label className="field-label">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
                <label className="field-label">Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
              </div>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-button"><Plus size={17} /> Create task</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, helper, icon, tone }: { label: string; value: number; helper: string; icon: React.ReactNode; tone: string }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><p>{label}</p><div className="stat-value">{value}</div><span>{helper}</span></article>;
}

function TaskRow({ task, onStatusChange, onDelete }: { task: Task; onStatusChange: (id: string, status: TaskStatus) => void; onDelete: (id: string) => void }) {
  const nextStatus: Record<TaskStatus, TaskStatus> = { todo: "in-progress", "in-progress": "done", done: "todo" };
  return (
    <article className="task-row">
      <button className={`task-check ${task.status === "done" ? "checked" : ""}`} aria-label={`Mark ${task.title} as ${statusLabels[nextStatus[task.status]]}`} onClick={() => onStatusChange(task.id, nextStatus[task.status])}>{task.status === "done" && <Check size={13} />}</button>
      <div className="task-main"><strong className={task.status === "done" ? "completed-title" : ""}>{task.title}</strong><p>{task.description || "No description added"}</p></div>
      <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
      <span className={`status-badge ${task.status}`}>{statusLabels[task.status]}</span>
      <span className="due-date"><CalendarDays size={14} />{formatDate(task.dueDate)}</span>
      <button className="delete-button" onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`}><Trash2 size={16} /></button>
    </article>
  );
}
