const { isUndefined } = require("../../helpers/compare.helpers");
const { formatErrorResponse } = require("../../helpers/helpers");
const { HTTP_OK, HTTP_NOT_FOUND, HTTP_BAD_REQUEST } = require("../../helpers/response.helpers");
const { areIdsEqual } = require("../../helpers/compare.helpers");

// Unified storage
let todos = [
  {
    id: 1,
    title: "Learn Express",
    status: "inProgress",
    creationDate: "2024-01-10T10:00:00Z",
    priority: "high",
    tags: ["learning", "backend"],
    description: "Learn Express.js framework basics",
    position: 0,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    title: "Create TODO API",
    status: "completed",
    creationDate: "2024-01-10T11:00:00Z",
    priority: "medium",
    tags: ["project", "api"],
    description: "Implement a RESTful API for todo management",
    position: 1,
    deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// transform function for non templates
const nonTemplates = (todo) => {
  return !todo.isTemplate;
};

// Transform functions for different versions
const toV1 = (todo) => ({
  id: todo.id,
  title: todo.title,
  isCompleted: todo.status === "completed",
});

const toV2 = (todo) => ({
  id: todo.id,
  title: todo.title,
  isCompleted: todo.status === "completed",
  creationDate: todo.creationDate,
  priority: todo.priority,
});

const toV3 = (todo) => ({
  id: todo.id,
  title: todo.title,
  isCompleted: todo.status === "completed",
  creationDate: todo.creationDate,
  priority: todo.priority,
  tags: todo.tags,
  description: todo.description,
});

const toV4 = (todo) => ({
  id: todo.id,
  title: todo.title,
  status: todo.status,
  isCompleted: todo.status === "completed",
  creationDate: todo.creationDate,
  priority: todo.priority,
  tags: todo.tags,
  description: todo.description,
  position: todo.position,
});

const toV5 = (todo) => ({
  id: todo.id,
  title: todo.title,
  status: todo.status,
  isCompleted: todo.status === "completed",
  creationDate: todo.creationDate,
  priority: todo.priority,
  tags: todo.tags,
  description: todo.description,
  position: todo.position,
  deadline: todo.deadline,
});

// Add new transform function for V6
const toV6 = (todo) => ({
  ...toV5(todo), // Include all V5 properties
  parentId: todo.parentId || null,
  subtasks: todos.filter((t) => t.parentId === todo.id).map(toV6),
  timeTracking: todo.timeTracking || {
    total: 0,
    sessions: [],
    isRunning: false,
    lastStarted: null,
  },
  recurrence: todo.recurrence || null, // daily, weekly, monthly
  category: todo.category || "default",
  sharedWith: todo.sharedWith || [],
  template: todo.template || null,
  statistics: todo.statistics || {
    timeSpent: 0,
    completionRate: 0,
    lastUpdated: null,
  },
});

// V1 Handlers
const todoV1 = {
  getAll: (req, res) => {
    let filteredTodos = [...todos].filter(nonTemplates);
    res.status(HTTP_OK).json(filteredTodos.map(toV1));
  },

  create: (req, res) => {
    const { title } = req.body;
    if (isUndefined(title)) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Title is required"));
    }

    const newTodo = {
      id: todos.length + 1,
      title,
      status: "todo",
      creationDate: new Date().toISOString(),
      priority: "medium",
      tags: [],
      description: "",
      position: todos.length,
    };
    todos.push(newTodo);
    res.status(HTTP_OK).json(toV1(newTodo));
  },

  update: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    const { title, isCompleted } = req.body;
    todos[todoIndex] = {
      ...todos[todoIndex],
      title: title || todos[todoIndex].title,
      status: isCompleted !== undefined ? (isCompleted ? "completed" : "todo") : todos[todoIndex].status,
    };
    res.status(HTTP_OK).json(toV1(todos[todoIndex]));
  },

  delete: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    const deletedPosition = todos[todoIndex].position;
    todos = todos.filter((t) => !areIdsEqual(t.id, id));

    todos.forEach((todo) => {
      if (todo.position > deletedPosition) {
        todo.position--;
      }
    });

    res.status(HTTP_OK).json({ message: "Todo deleted" });
  },
};

// V2 Handlers
const todoV2 = {
  getAll: (req, res) => {
    let filteredTodos = [...todos].filter(nonTemplates);
    res.status(HTTP_OK).json(filteredTodos.map(toV2));
  },

  create: (req, res) => {
    const { title, priority = "medium" } = req.body;
    if (isUndefined(title)) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Title is required"));
    }

    const newTodo = {
      id: todos.length + 1,
      title,
      status: "todo",
      creationDate: new Date().toISOString(),
      priority,
      tags: [],
      description: "",
      position: todos.length,
    };
    todos.push(newTodo);
    res.status(HTTP_OK).json(toV2(newTodo));
  },

  update: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    const { title, isCompleted, priority } = req.body;
    todos[todoIndex] = {
      ...todos[todoIndex],
      title: title || todos[todoIndex].title,
      status: isCompleted !== undefined ? (isCompleted ? "completed" : "todo") : todos[todoIndex].status,
      priority: priority || todos[todoIndex].priority,
    };
    res.status(HTTP_OK).json(toV2(todos[todoIndex]));
  },

  delete: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    const deletedPosition = todos[todoIndex].position;
    todos = todos.filter((t) => !areIdsEqual(t.id, id));

    todos.forEach((todo) => {
      if (todo.position > deletedPosition) {
        todo.position--;
      }
    });

    res.status(HTTP_OK).json({ message: "Todo deleted" });
  },
};

// V3 Handlers
const todoV3 = {
  getAll: (req, res) => {
    let filteredTodos = [...todos].filter(nonTemplates);
    res.status(HTTP_OK).json(filteredTodos.map(toV3));
  },

  create: (req, res) => {
    const { title, priority = "medium", tags = [], description = "" } = req.body;
    if (isUndefined(title)) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Title is required"));
    }

    const newTodo = {
      id: todos.length + 1,
      title,
      status: "todo",
      creationDate: new Date().toISOString(),
      priority,
      tags,
      description,
      position: todos.length,
    };
    todos.push(newTodo);
    res.status(HTTP_OK).json(toV3(newTodo));
  },

  update: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    const {
      title = todos[todoIndex].title,
      isCompleted = todos[todoIndex].isCompleted,
      priority = todos[todoIndex].priority,
      tags = todos[todoIndex].tags,
      description = todos[todoIndex].description,
    } = req.body;

    todos[todoIndex] = {
      ...todos[todoIndex],
      title,
      status: isCompleted !== undefined ? (isCompleted ? "completed" : "todo") : todos[todoIndex].status,
      priority,
      tags,
      description,
    };

    res.status(HTTP_OK).json(toV3(todos[todoIndex]));
  },

  delete: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    const deletedPosition = todos[todoIndex].position;
    todos = todos.filter((t) => !areIdsEqual(t.id, id));

    todos.forEach((todo) => {
      if (todo.position > deletedPosition) {
        todo.position--;
      }
    });

    res.status(HTTP_OK).json({ message: "Todo deleted" });
  },
};

// V4 Handlers
const todoV4 = {
  getAll: (req, res) => {
    const { search, status, priority, tags, hideCompleted } = req.query;
    let filteredTodos = [...todos].filter(nonTemplates);

    if (hideCompleted === "true" || hideCompleted === "1") {
      filteredTodos = filteredTodos.filter((todo) => todo.status !== "completed");
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredTodos = filteredTodos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchLower) ||
          todo.description.toLowerCase().includes(searchLower) ||
          todo.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    if (status) {
      filteredTodos = filteredTodos.filter((todo) => todo.status === status);
    }

    if (priority) {
      filteredTodos = filteredTodos.filter((todo) => todo.priority === priority);
    }

    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
      filteredTodos = filteredTodos.filter((todo) => todo.tags.some((tag) => tagList.includes(tag.toLowerCase())));
    }

    filteredTodos.sort((a, b) => a.position - b.position);

    res.status(HTTP_OK).json(filteredTodos.map(toV4));
  },

  create: (req, res) => {
    const { title, priority = "medium", tags = [], description = "", status = "todo" } = req.body;
    if (isUndefined(title)) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Title is required"));
    }

    const newTodo = {
      id: todos.length + 1,
      title,
      status,
      creationDate: new Date().toISOString(),
      priority,
      tags,
      description,
      position: todos.length,
    };
    todos.push(newTodo);
    res.status(HTTP_OK).json(toV4(newTodo));
  },

  update: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    const {
      title = todos[todoIndex].title,
      status = todos[todoIndex].status,
      priority = todos[todoIndex].priority,
      tags = todos[todoIndex].tags,
      description = todos[todoIndex].description,
      position,
    } = req.body;

    if (typeof position === "number") {
      const oldPosition = todos[todoIndex].position;
      if (position !== oldPosition) {
        todos.forEach((todo) => {
          if (position > oldPosition) {
            if (todo.position <= position && todo.position > oldPosition) {
              todo.position--;
            }
          } else {
            if (todo.position >= position && todo.position < oldPosition) {
              todo.position++;
            }
          }
        });
      }
    }

    todos[todoIndex] = {
      ...todos[todoIndex],
      title,
      status,
      priority,
      tags,
      description,
      position: typeof position === "number" ? position : todos[todoIndex].position,
    };

    res.status(HTTP_OK).json(toV4(todos[todoIndex]));
  },

  delete: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    const deletedPosition = todos[todoIndex].position;
    todos = todos.filter((t) => !areIdsEqual(t.id, id));

    todos.forEach((todo) => {
      if (todo.position > deletedPosition) {
        todo.position--;
      }
    });

    res.status(HTTP_OK).json({ message: "Todo deleted" });
  },
};

// V5 Handlers
const todoV5 = {
  getAll: (req, res) => {
    const { search, status, priority, tags, hideCompleted, view } = req.query;
    let filteredTodos = [...todos].filter(nonTemplates);

    if (hideCompleted === "true" || hideCompleted === "1") {
      filteredTodos = filteredTodos.filter((todo) => todo.status !== "completed");
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredTodos = filteredTodos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchLower) ||
          todo.description.toLowerCase().includes(searchLower) ||
          todo.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    if (status) {
      filteredTodos = filteredTodos.filter((todo) => todo.status === status);
    }

    if (priority) {
      filteredTodos = filteredTodos.filter((todo) => todo.priority === priority);
    }

    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
      filteredTodos = filteredTodos.filter((todo) => todo.tags.some((tag) => tagList.includes(tag.toLowerCase())));
    }

    filteredTodos.sort((a, b) => {
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return a.position - b.position;
    });

    res.status(HTTP_OK).json(filteredTodos.map(toV5));
  },

  create: (req, res) => {
    const { title, priority = "medium", tags = [], description = "", status = "todo", deadline = null } = req.body;

    if (isUndefined(title)) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Title is required"));
    }

    const newTodo = {
      id: todos.length + 1,
      title,
      status,
      creationDate: new Date().toISOString(),
      priority,
      tags,
      description,
      position: todos.length,
      deadline,
    };
    todos.push(newTodo);
    res.status(HTTP_OK).json(toV5(newTodo));
  },

  update: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    const {
      title = todos[todoIndex].title,
      status = todos[todoIndex].status,
      priority = todos[todoIndex].priority,
      tags = todos[todoIndex].tags,
      description = todos[todoIndex].description,
      position,
      deadline = todos[todoIndex].deadline,
    } = req.body;

    if (typeof position === "number") {
      const oldPosition = todos[todoIndex].position;
      if (position !== oldPosition) {
        todos.forEach((todo) => {
          if (position > oldPosition) {
            if (todo.position <= position && todo.position > oldPosition) {
              todo.position--;
            }
          } else {
            if (todo.position >= position && todo.position < oldPosition) {
              todo.position++;
            }
          }
        });
      }
    }

    todos[todoIndex] = {
      ...todos[todoIndex],
      title,
      status,
      priority,
      tags,
      description,
      position: typeof position === "number" ? position : todos[todoIndex].position,
      deadline,
    };

    res.status(HTTP_OK).json(toV5(todos[todoIndex]));
  },

  delete: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    const deletedPosition = todos[todoIndex].position;
    todos = todos.filter((t) => !areIdsEqual(t.id, id));

    todos.forEach((todo) => {
      if (todo.position > deletedPosition) {
        todo.position--;
      }
    });

    res.status(HTTP_OK).json({ message: "Todo deleted" });
  },
};

// V6 Handlers
const todoV6 = {
  getAll: (req, res) => {
    const { search, status, priority, tags, hideCompleted, category, parent, shared, template } = req.query;

    let filteredTodos = [...todos];

    // Handle template filter differently
    if (template === "true") {
      filteredTodos = filteredTodos.filter((todo) => todo.isTemplate);
      return res.status(HTTP_OK).json(filteredTodos);
    }

    if (hideCompleted === "true" || hideCompleted === "1") {
      filteredTodos = filteredTodos.filter((todo) => todo.status !== "completed");
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredTodos = filteredTodos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchLower) ||
          todo.description.toLowerCase().includes(searchLower) ||
          todo.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    if (category) {
      filteredTodos = filteredTodos.filter((todo) => todo.category === category);
    }

    if (parent) {
      filteredTodos = filteredTodos.filter((todo) => todo.parentId === parseInt(parent));
    }

    if (shared) {
      filteredTodos = filteredTodos.filter((todo) => todo.sharedWith.includes(shared));
    }

    if (template) {
      filteredTodos = filteredTodos.filter((todo) => todo.template === template);
    }

    // Get only root tasks (tasks without parents)
    if (!parent) {
      filteredTodos = filteredTodos.filter((todo) => !todo.parentId);
    }

    // Transform to V6 format (includes subtasks hierarchy)
    const transformedTodos = filteredTodos.map(toV6);

    res.status(HTTP_OK).json(transformedTodos);
  },

  create: (req, res) => {
    const {
      title,
      priority = "medium",
      tags = [],
      description = "",
      status = "todo",
      deadline = null,
      parentId = null,
      recurrence = null,
      category = "default",
      sharedWith = [],
      template = null,
    } = req.body;

    if (isUndefined(title)) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Title is required"));
    }

    const newTodo = {
      id: todos.length + 1,
      title,
      status,
      creationDate: new Date().toISOString(),
      priority,
      tags,
      description,
      position: todos.length,
      deadline,
      parentId,
      timeTracking: {
        total: 0,
        sessions: [],
        isRunning: false,
        lastStarted: null,
      },
      recurrence,
      category,
      sharedWith,
      template,
      statistics: {
        timeSpent: 0,
        completionRate: 0,
        lastUpdated: new Date().toISOString(),
      },
    };

    todos.push(newTodo);
    res.status(HTTP_OK).json(toV6(newTodo));
  },

  update: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    const updatedTodo = {
      ...todos[todoIndex],
      ...req.body,
      id: todos[todoIndex].id, // Preserve ID
    };

    updatedTodo.statistics = {
      ...updatedTodo.statistics,
      lastUpdated: new Date().toISOString(),
    };

    todos[todoIndex] = updatedTodo;
    res.status(HTTP_OK).json(toV6(updatedTodo));
  },

  startTimer: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    // Initialize timeTracking if it doesn't exist
    if (!todos[todoIndex].timeTracking) {
      todos[todoIndex].timeTracking = {
        total: 0,
        sessions: [],
        isRunning: false,
        lastStarted: null,
      };
    }

    // Check if timer is already running
    if (todos[todoIndex].timeTracking.isRunning) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Timer is already running"));
    }

    const now = new Date().toISOString();
    todos[todoIndex].timeTracking.isRunning = true;
    todos[todoIndex].timeTracking.lastStarted = now;
    todos[todoIndex].timeTracking.sessions.push({ start: now });

    res.status(HTTP_OK).json(toV6(todos[todoIndex]));
  },

  stopTimer: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    // Initialize timeTracking if it doesn't exist
    if (!todos[todoIndex].timeTracking) {
      todos[todoIndex].timeTracking = {
        total: 0,
        sessions: [],
        isRunning: false,
        lastStarted: null,
      };
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Timer was not running"));
    }

    // Check if timer is not running
    if (!todos[todoIndex].timeTracking.isRunning) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Timer is not running"));
    }

    const now = new Date();
    const lastSession = todos[todoIndex].timeTracking.sessions.at(-1);
    if (lastSession && !lastSession.end) {
      const duration = now - new Date(lastSession.start);
      lastSession.end = now.toISOString();
      todos[todoIndex].timeTracking.total += duration;
      todos[todoIndex].timeTracking.isRunning = false;
      todos[todoIndex].timeTracking.lastStarted = null;

      // Update statistics
      if (!todos[todoIndex].statistics) {
        todos[todoIndex].statistics = {
          timeSpent: 0,
          completionRate: 0,
          lastUpdated: null,
        };
      }
      todos[todoIndex].statistics.timeSpent += duration;
      todos[todoIndex].statistics.lastUpdated = now.toISOString();
    }

    res.status(HTTP_OK).json(toV6(todos[todoIndex]));
  },

  createTemplate: (req, res) => {
    const { title, template } = req.body;
    if (!title || !template) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Title and template are required"));
    }

    const newTemplate = {
      id: todos.length + 1,
      title,
      isTemplate: true,
      template,
      creationDate: new Date().toISOString(),
      category: "template",
      status: "template",
      tags: [],
    };

    todos.push(newTemplate);
    res.status(HTTP_OK).json(newTemplate);
  },

  delete: (req, res, id) => {
    const todoIndex = todos.findIndex((t) => areIdsEqual(t.id, id));
    if (todoIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Todo not found"));
    }

    const todo = todos[todoIndex];

    if (todo.isTemplate) {
      // Simple delete for templates
      todos = todos.filter((t) => !areIdsEqual(t.id, id));
    } else {
      // Delete todo and its subtasks
      const deleteIds = [id];
      const findSubtasks = (parentId) => {
        todos.forEach((todo) => {
          if (todo.parentId === parentId) {
            deleteIds.push(todo.id);
            findSubtasks(todo.id);
          }
        });
      };
      findSubtasks(parseInt(id));
      todos = todos.filter((t) => !deleteIds.includes(t.id));
    }

    res.status(HTTP_OK).json({ message: todo.isTemplate ? "Template deleted" : "Todo and subtasks deleted" });
  },
};

module.exports = {
  todoV1,
  todoV2,
  todoV3,
  todoV4,
  todoV5,
  todoV6,
};
