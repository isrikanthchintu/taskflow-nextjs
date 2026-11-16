"use client";

import { useEffect, useState } from "react";
import { readTasks, writeTasks } from "@/lib/task-storage";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";

const starterTasks: Task[] = [
  {
    id: "seed-1",
    title: "Review the product roadmap",
    description: "Align the next sprint with the product milestones.",
    status: "in-progress",
    priority: "high",
    dueDate: "2026-11-20",
    createdAt: "2026-11-10T09:00:00.000Z"
  },
  {
    id: "seed-2",
    title: "Update component documentation",
    description: "Document reusable UI patterns and usage examples.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-11-22",
    createdAt: "2026-11-11T09:00:00.000Z"
  },
  {
    id: "seed-3",
    title: "Fix mobile navigation spacing",
    description: "Check the sidebar and header at small breakpoints.",
    status: "done",
    priority: "low",
    dueDate: "2026-11-14",
    createdAt: "2026-11-08T09:00:00.000Z"
  },
  {
    id: "seed-4",
    title: "Prepare sprint planning notes",
    description: "Collect open questions before the team planning session.",
    status: "todo",
    priority: "high",
    dueDate: "2026-11-24",
    createdAt: "2026-11-12T09:00:00.000Z"
  }
];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = readTasks();
    setTasks(stored.length > 0 ? stored : starterTasks);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) writeTasks(tasks);
  }, [tasks, isReady]);

  function addTask(input: Pick<Task, "title" | "description" | "priority" | "dueDate">) {
    const task: Task = {
      ...input,
      id: crypto.randomUUID(),
      status: "todo",
      createdAt: new Date().toISOString()
    };
    setTasks((current) => [task, ...current]);
  }

  function updateTask(id: string, updates: Partial<Omit<Task, "id" | "createdAt">>) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...updates } : task));
  }

  function deleteTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function setStatus(id: string, status: TaskStatus) {
    updateTask(id, { status });
  }

  return { tasks, isReady, addTask, updateTask, deleteTask, setStatus };
}
