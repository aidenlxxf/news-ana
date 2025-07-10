import CreateTaskForm from "@/components/create-task-form";
import TaskList from "@/components/task-list";
import TaskConfigurationChat from "@/components/task-configuration-chat";
import Toolbar from "@/components/toolbar";
import { listTasks } from "@/lib/api";

export default function Home() {
  // Fetch tasks for the TaskConfigurationChat component
  const tasksPromise = listTasks(50, 0); // Load up to 50 tasks for selection

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              News Analysis Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your news analysis tasks and monitor their execution
              status.
            </p>
          </div>
          <Toolbar />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Task List */}
          <div className="space-y-6">
            <TaskList />
          </div>

          {/* Right Column: AI Chat and Create Task Form */}
          <div className="space-y-6">
            <TaskConfigurationChat tasksPromise={tasksPromise} />
            <CreateTaskForm />
          </div>
        </div>
      </div>
    </div>
  );
}
