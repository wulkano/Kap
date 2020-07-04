import React, {useState, useEffect, useRef} from 'react';
import PropTypes from 'prop-types';

const Actions = ({buttons, performAction, defaultId}) => {
  const [activeButton, setActiveButton] = useState();
  const defaultButton = useRef(null);

  useEffect(() => {
    setActiveButton();
    if (defaultButton.current) {
      defaultButton.current.focus();
    }
  }, [buttons]);

  const action = async index => {
    setActiveButton(index);
    performAction(index);
  };

  return (
    <div className="container">
      {
        buttons.map((button, index) => (
          <button
            ref={index === defaultId ? defaultButton : undefined}
            key={button.label}
            type="button"
            onClick={() => action(index)}
          >
            {index === activeButton ? button.activeLabel || button.label : button.label}
          </button>
        ))
      }

      <style jsx>{`
        .container {
          padding: 16px 24px 16px 0;
          display: flex;
          justify-content: flex-end;
          flex-shrink: 0;
        }

        button {
          white-space: nowrap;
          padding: 4px 20px;
          font-size: 1.25rem;
          color: var(--system-control-text);
          border-radius: 4px;
          text-align: center;
        }

        button + button {
          margin-left: 16px;
        }
      `}</style>
    </div>
  );
};

Actions.propTypes = {
  performAction: PropTypes.elementType,
  defaultId: PropTypes.number,
  buttons: PropTypes.arrayOf(PropTypes.object)
};

export default Actions;
