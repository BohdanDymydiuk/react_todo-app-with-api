/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  deleteTodo,
  getTodos,
  patchTodo,
  postTodo,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import { Header } from './components/Header';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';
import { Error } from './components/Error';

export enum Filter {
  all = 'All',
  active = 'Active',
  completed = 'Completed',
}

export const App: React.FC = () => {
  // #region variables

  const [value, setValue] = useState<string>('');
  const [editedValue, setEditedValue] = useState<string>('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isInputDisabled, setIsInputDisabled] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>(Filter.all);
  const [error, setError] = useState<string>('');
  const [allCompleted, setAllCompleted] = useState<boolean>(false);
  const [editedInputById, setEditedInputById] = useState<number>(-1);
  const [key, setKey] = useState<string>('');

  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      switch (filter) {
        case Filter.active:
          return !todo.completed;
        case Filter.completed:
          return todo.completed;
        default:
          return todo;
      }
    });
  }, [filter, todos]);

  const completedTodos = todos.filter(todo => todo.completed);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const editedInputRef = useRef<HTMLInputElement | null>(null);
  const nrOfActiveTodos = todos.filter(todo => !todo.completed).length;

  // #endregion
  // #region variables for loader

  const [idsOfRecedingTodos, setIdsOfRecedingTodos] = useState<number[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [idsOfTodosOnSelect, setIdsOfTodosOnSelect] = useState<number[]>([]);

  // #endregion
  // #region useEffects

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => {
        setError('Unable to load todos');
        setTimeout(() => setError(''), 3000);
      });
  }, []);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [isInputDisabled]);

  useEffect(() => {
    if (completedTodos.length > 0 && completedTodos.length === todos.length) {
      setAllCompleted(true);
    } else if (allCompleted) {
      setAllCompleted(false);
    }
  }, [allCompleted, completedTodos, todos.length]);

  useEffect(() => {
    if (editedInputRef.current && editedInputById) {
      editedInputRef.current.focus();
    }
  }, [editedInputById]);

  // #endregion
  // #region functions

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      setError('Title should not be empty');

      return;
    }

    const todo = {
      id: 0,
      userId: USER_ID,
      title: trimmedValue,
      completed: false,
    };

    setTempTodo(todo);
    setIsInputDisabled(true);

    postTodo(todo)
      .then(_todo => {
        setTodos(currentTodos => [...currentTodos, _todo]);
        setValue('');
      })
      .catch(() => {
        setError('Unable to add a todo');
        setTimeout(() => setError(''), 3000);
      })
      .finally(() => {
        setTempTodo(null);
        setIsInputDisabled(false);
      });
  }

  function deleteRequest(id: number) {
    deleteTodo(id)
      .then(() => {
        setTimeout(() => {
          setTodos(currentTodos =>
            currentTodos.filter(_todo => _todo.id !== id),
          );
        }, 500);
      })
      .catch(() => {
        setError('Unable to delete a todo');

        setTimeout(() => setError(''), 3000);
      })
      .finally(() => {
        setTimeout(() => {
          setIdsOfRecedingTodos(ids => ids.slice(1));
          inputRef.current?.focus();
        }, 500);
      });
  }

  function onDelete(id: number) {
    setIdsOfRecedingTodos(ids => [...ids, id]);
    deleteRequest(id);
  }

  function onDeleteSelected() {
    todos.forEach(todo => {
      if (todo.completed) {
        const { id } = todo;

        setIdsOfRecedingTodos(ids => [...ids, id]);
        deleteRequest(id);
      }
    });
  }

  function onSelect(id: number, todo: Todo) {
    setIdsOfTodosOnSelect(ids => [...ids, id]);

    patchTodo(id, todo)
      .then(_todo => {
        setTodos(currentTodos => {
          return currentTodos.map(t => (_todo.id === t.id ? _todo : t));
        });
        if (editedInputById !== -1) {
          setEditedInputById(-1);
        }
      })
      .catch(() => {
        setError('Unable to update a todo');
        setTimeout(() => setError(''), 3000);
      })
      .finally(() => setIdsOfTodosOnSelect(ids => ids.slice(1)));
  }

  function toogleAll() {
    const todosForToogle = todos.filter(todo =>
      allCompleted ? todo.completed : !todo.completed,
    );

    setAllCompleted(!allCompleted);

    todosForToogle.forEach(todo => {
      const { id, completed } = todo;

      onSelect(id, { ...todo, completed: !completed });
    });
  }

  function setForm(id: number) {
    const editedTodo = todos.find(todo => todo.id === id);

    if (editedTodo) {
      setEditedValue(editedTodo.title);
    }

    setEditedInputById(id);
  }

  function keyUp(event: React.KeyboardEvent) {
    setKey(event.key);
  }

  function onSubmitChangedInput(event: React.FormEvent) {
    event.preventDefault();
    const editedTodo = todos.find(todo => todo.id === editedInputById) as Todo;
    const trimmedValue = editedValue.trim();
    const { title, id } = editedTodo;

    if (title === trimmedValue) {
      setEditedInputById(-1);

      return;
    }

    if (trimmedValue.length === 0) {
      setIdsOfRecedingTodos(ids => [...ids, id]);
      deleteRequest(id);

      setTimeout(() => {
        setEditedInputById(-1);
      }, 500);

      return;
    }

    editedTodo.title = trimmedValue;

    onSelect(id, editedTodo);
  }

  // #endregion
  // #region filter functions

  function allSelected() {
    setFilter(Filter.all);
  }

  function activeSelected() {
    setFilter(Filter.active);
  }

  function completedSelected() {
    setFilter(Filter.completed);
  }

  // #endregion
  // #region conditions

  if (error) {
    setTimeout(() => setError(''), 3000);
  }

  if (!USER_ID) {
    return <UserWarning />;
  }

  if (key === 'Escape') {
    setEditedInputById(-1);
    setKey('');
  }

  // #endregion
  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          value={value}
          isInputDisabled={isInputDisabled}
          allCompleted={allCompleted}
          todos={todos}
          inputRef={inputRef}
          onSubmit={onSubmit}
          setValue={setValue}
          toogleAll={toogleAll}
        />
        <TodoList
          tempTodo={tempTodo}
          editedInputById={editedInputById}
          editedValue={editedValue}
          filteredTodos={filteredTodos}
          idsOfTodosOnSelect={idsOfTodosOnSelect}
          idsOfRecedingTodos={idsOfRecedingTodos}
          editedInputRef={editedInputRef}
          onDelete={onDelete}
          onSelect={onSelect}
          setForm={setForm}
          setEditedValue={setEditedValue}
          onSubmitChangedInput={onSubmitChangedInput}
          keyUp={keyUp}
        />

        {todos.length > 0 && (
          <Footer
            filter={filter}
            nrOfActiveTodos={nrOfActiveTodos}
            todos={todos}
            allSelected={allSelected}
            activeSelected={activeSelected}
            completedSelected={completedSelected}
            onDeleteSelected={onDeleteSelected}
          />
        )}
      </div>

      <Error error={error} />
    </div>
  );
};
