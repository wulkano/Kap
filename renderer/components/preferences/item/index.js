import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class Item extends React.Component {
  static defaultProps = {
    subtitle: [],
    errors: []
  }

  render() {
    const {
      title,
      subtitle,
      experimental,
      tooltip,
      children,
      id,
      vertical,
      errors
    } = this.props;

    const subtitleArray = Array.isArray(subtitle) ? subtitle : [subtitle];

    const className = classNames({experimental});

    return (
      <div className="container" id={id}>
        <div className="item">
          <div className="content">
            <div className={className}>{title}</div>
            <div className="subtitle" title={tooltip}>
              { subtitleArray.map(s => <div key={s}>{s}</div>) }
            </div>
          </div>
          <div className="input">
            {children}
          </div>
        </div>
        <div className="errors">
          { errors.map(e => <div key={e}>{e}</div>) }
        </div>
        <style jsx>{`
          .container {
            display: flex;
            max-width: 100%;
            padding: 16px;
            border-bottom: 1px solid #f1f1f1;
            flex-direction: column;
          }

          .item {
            display: flex;
            flex-direction: ${vertical ? 'column' : 'row'};
          }

          .content {
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .subtitle {
            color: gray;
            font-size: 1.2rem;
          }

          .input {
            display: flex;
            align-items: center;
          }

          .experimental {
            display: flex;
            align-items: center;
          }

          .errors {
            padding-top: 8px;
            color: red;
            font-size: 1.2rem;
            line-height: 1.2rem;
          }

          .experimental:after {
            border: 1px solid #ddd;
            color: gray;
            content: 'experimental';
            display: inline-block;
            font-size: 0.8rem;
            font-weight: 500;
            margin: 0 1rem;
            border-radius: 3px;
            padding: 3px 4px;
            text-transform: uppercase;
            width: max-content;
            line-height: 1;
          }
        `}</style>
      </div>
    );
  }
}

Item.propTypes = {
  id: PropTypes.string,
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  experimental: PropTypes.bool,
  tooltip: PropTypes.string,
  subtitle: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  vertical: PropTypes.bool,
  errors: PropTypes.arrayOf(PropTypes.string)
};

export default Item;
