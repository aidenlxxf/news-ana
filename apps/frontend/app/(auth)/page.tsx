import CreateTaskForm from "@/components/create-task-form";
import TaskList from "@/components/task-list";
import Toolbar from "@/components/toolbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            News Analysis Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your news analysis tasks and monitor their execution status.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Task List */}
          <div className="space-y-6">
            <Toolbar />
            <TaskList />
          </div>

          {/* Right Column: Create Task Form */}
          <div className="space-y-6">
            <CreateTaskForm />
          </div>
        </div>
      </div>
    </div>
  );
}
