(function () {
  "use strict;"

  var kDBName     = 'Numbers_Crash';
  var kDBVersion  = 1;

  var kValuesStore = {
    name    : 'values',
    keyPath : 'name',
    fields  : {
      name    : 'name',
      value   : 'value'
    }
  };

  var kValues = [
    { name: "0x80000000", bad: 2147483648, good: -2147483648 },
    { name: "0xFFFFFFFF", bad: 4294967295, good: -1 }
  ];

  var indexedDB   = window.indexedDB    || window.webkitIndexedDB;
  var IDBKeyRange = window.IDBKeyRange  || window.webkitIDBKeyRange;

  var m_db = null; // Our opened IndexedDB

  var m_LogElem = null;

  //-----------------------------------------------------------------------------------------------
  function pageLog( msg ) {
    var msgElem = $( '<li>' + msg + '</li>' );
    m_LogElem.append( msgElem );

    setTimeout( function () {
      msgElem[0].scrollIntoView( false );
    }, 1 );

    console.log( msg );
  }

  //-----------------------------------------------------------------------------------------------
  function dbVersionUpgrade() {
    // Just destroy/rebuild it
    if( m_db.objectStoreNames.length ) {
      var existingStores = [];
      for( var i = 0; i < m_db.objectStoreNames.length; ++i ) {
        existingStores.push( m_db.objectStoreNames[i] );
      }
      for( var i = 0; i < existingStores.length; ++i ) {
        m_db.deleteObjectStore( existingStores[i] );
      }
    }
    var valuesStore = m_db.createObjectStore( kValuesStore.name, { keyPath: kValuesStore.keyPath, autoIncrement: false } );
  }

  //-----------------------------------------------------------------------------------------------
  function openDB() {
    pageLog( 'Opening IndexedDB "' + kDBName + '"' );

    var dbRequest = indexedDB.open( kDBName, kDBVersion );

    dbRequest.onerror = function ( event ) {
      pageLog( 'Error opening IndexedDB ' + kDBName + '. Event object output to console' );
      console.error( event );
    };

    dbRequest.onupgradeneeded = function ( event ) {
      m_db = dbRequest.result;
      dbVersionUpgrade( event );
    };

    dbRequest.onsuccess = function( event ) {
      m_db = dbRequest.result;
      $('#db_name_display').html( kDBName );
      pageLog( 'IndexedDB ' + kDBName + ' opened');
    };
  }

  //-----------------------------------------------------------------------------------------------
  function buildDB( valueField ) {
    pageLog( 'Putting "' + valueField + '" values into the DB');

    var newValueTransaction = m_db.transaction( [kValuesStore.name], "readwrite" );
    var valuesStore         = newValueTransaction.objectStore( kValuesStore.name );
    for( var valueIndex = 0; valueIndex < kValues.length; valueIndex += 1 ) {
      var currValue = kValues[valueIndex];

      var newEntry = {};
      newEntry[kValuesStore.fields.name]  = 'value' + valueIndex;
      newEntry[kValuesStore.fields.value] = currValue[valueField];
      pageLog( 'Adding: ' + JSON.stringify(newEntry) );
      valuesStore.put( newEntry );
    }

    newValueTransaction.oncomplete = function () {
      pageLog( 'Done putting ' + valueField + 'ness into DB' );
    };
  }

  //-----------------------------------------------------------------------------------------------
  function readDB() {
    pageLog( 'Reading all values in DB ' + kDBName + '...' );

    var newValueTransaction = m_db.transaction( [kValuesStore.name], "readonly" );
    var valueStore          = newValueTransaction.objectStore( kValuesStore.name );
    var valueCursor         = valueStore.openCursor();

    var valueReadCount = 0;
    valueCursor.onsuccess = function ( event ) {
      var currCursor = event.target.result;
      if( currCursor ) {
        valueReadCount += 1;

        pageLog( 'Value #' + valueReadCount + ': ' + JSON.stringify( currCursor.value ) );
        console.log( currCursor );

        currCursor.continue();
      } else {
        pageLog( 'Read complete: ' + valueReadCount + ' values read from DB' );
      }
    }
  }

  //-----------------------------------------------------------------------------------------------
  function initTest() {
    var topBarElem = $('#top_bar');
    var topBarHeight = topBarElem.outerHeight();

    m_LogElem = $('#output_log');
    m_LogElem.css( 'padding-top', topBarHeight.toString() + 'px' );

    $('#button_build_bad').click( function () { buildDB( 'bad' ); } );
    $('#button_build_good').click( function () { buildDB( 'good' ); } );
    $('#button_read_db' ).click( readDB );

    openDB();
  }
  $(document).ready( initTest );
})();
