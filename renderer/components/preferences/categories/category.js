import React from 'react';
import PropTypes from 'prop-types';

class Category extends React.Component {
  render() {
    return (
      <div className="category">
        {this.props.children}
        <style jsx>{`
            .category {
              overflow-y: auto;
              width: 100%;
              height: 100%;
              flex-shrink: 0;
            }
        `}</style>
      </div>
    );
  }
}

Category.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};

export default Category;
