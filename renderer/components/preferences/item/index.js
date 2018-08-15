import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class Item extends React.Component {
  render() {
    const {title, experimental, tooltip, children, id} = this.props;

    let subtitle = this.props.subtitle || [];

    if (!Array.isArray(subtitle)) {
      subtitle = [subtitle];
    }

    const className = classNames({experimental});

    return (
      <div className="item" id={id}>
        <div className="content">
          <div className={className}>{title}</div>
          <div className="subtitle" title={tooltip}>
            { subtitle.map(s => <div key={s}>{s}</div>) }
          </div>
        </div>
        <div className="input">
          {children}
        </div>
        <style jsx>{`
          .item {
            display: flex;
            max-width: 100%;
            padding: 16px;
            border-bottom: 1px solid #f1f1f1;
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

          .experimental:after {
            border: 1px solid #ddd;
            color: gray;
            content: "experimental";
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
  ])
};

export default Item;
