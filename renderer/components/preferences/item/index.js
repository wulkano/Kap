import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import linkifyUrls from 'linkify-urls';

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
      errors,
      onSubtitleClick,
      warning,
      onClick
    } = this.props;

    const subtitleArray = Array.isArray(subtitle) ? subtitle : [subtitle];

    const className = classNames('title', {experimental});
    const subtitleClassName = classNames('subtitle', {link: Boolean(onSubtitleClick)});

    return (
      <div className="container" onClick={onClick}>
        <div className="item" id={id}>
          {warning}
          <div className="content">
            <div className={className}>{title}</div>
            <div className={subtitleClassName} title={tooltip} onClick={onSubtitleClick}>
              {
                /* eslint-disable react/no-danger */
                subtitleArray.map(s => <div key={s} dangerouslySetInnerHTML={{__html: linkifyUrls(s)}}/>)
              }
            </div>
          </div>
          <div className="input">
            {children}
          </div>
        </div>
        {
          errors && errors.length > 0 && <div className="errors">{ errors.map(e => <div key={e}>{e}</div>) }</div>
        }
        <style jsx>{`
          .container {
            display: flex;
            max-width: 100%;
            padding: ${onClick ? '16px' : '32px'} 16px;
            border-bottom: 1px solid #f1f1f1;
            flex-direction: column;
          }

          .item {
            display: flex;
            flex-direction: ${vertical ? 'column' : 'row'};
          }

          .title {
            font-size: 1.2rem;
            line-height: 1.6rem;
            font-weight: 500;
          }

          .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .subtitle {
            color: ${onClick ? '#007aff' : '#000'};
            font-size: 1.2rem;
          }

          .subtitle a {
            color: #007aff;
            text-decoration: none;
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
            color: #ff6059;
            font-size: 1.2rem;
            line-height: 1.2rem;
          }

          .link {
            color: #007aff;
            cursor: pointer;
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
  errors: PropTypes.arrayOf(PropTypes.string),
  onSubtitleClick: PropTypes.func,
  warning: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  onClick: PropTypes.func
};

export default Item;
