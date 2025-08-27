import React from 'react';
import '../styles/KickedOut.css';

const KickedOut = () => (
  <div className="kickedout-container">
    <div className="kickedout-header">
      <span className="kickedout-badge">✦ Intervue Poll</span>
    </div>
    <h1 className="kickedout-title">You’ve been Kicked out !</h1>
    <p className="kickedout-desc">
      Looks like the teacher had removed you from the poll system. Please<br />
      Try again sometime.
    </p>
  </div>
);

export default KickedOut;
