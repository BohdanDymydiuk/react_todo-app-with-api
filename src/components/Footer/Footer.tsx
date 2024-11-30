import classNames from 'classnames';
import React from 'react';
import { Todo } from '../../types/Todo';
import { Filter } from '../../App';

interface Props {
  filter: string;
  nrOfActiveTodos: number;
  todos: Todo[];
  allSelected: () => void;
  activeSelected: () => void;
  completedSelected: () => void;
  onDeleteSelected: () => void;
}

export const Footer: React.FC<Props> = React.memo(
  ({
    filter,
    nrOfActiveTodos,
    todos,
    allSelected,
    activeSelected,
    completedSelected,
    onDeleteSelected,
  }) => {
    const isCompletedExists = todos.some(todo => todo.completed);
    const filterFs = [allSelected, activeSelected, completedSelected];
    const filterValues = Object.values(Filter);

    return (
      <footer className="todoapp__footer" data-cy="Footer">
        <span className="todo-count" data-cy="TodosCounter">
          {nrOfActiveTodos} items left
        </span>

        <nav className="filter" data-cy="Filter">
          {filterValues.map((value, i) => {
            return (
              <a
                key={value + i}
                href="#/"
                className={classNames('filter__link', {
                  selected: filter === value,
                })}
                data-cy={`FilterLink${value}`}
                onClick={filterFs[i]}
              >
                {value}
              </a>
            );
          })}
        </nav>

        <button
          type="button"
          className="todoapp__clear-completed"
          data-cy="ClearCompletedButton"
          disabled={!isCompletedExists}
          onClick={onDeleteSelected}
        >
          Clear completed
        </button>
      </footer>
    );
  },
);

Footer.displayName = 'Footer';
