function Parser(options) {
    // current absolute character position
    this.pos = -1;

    // The maxPos property is the last absolute character position that is
    // readable based on the currently received chunks
    this.maxPos = -1;

    // the current parser state
    this.state = null;

    // The raw string that we are parsing
    this.data = null;
}

Parser.createState = function(mixins) {
    return mixins;
};

Parser.prototype = {
    setInitialState: function(initialState) {
        this.initialState = initialState;
    },

    enterState: function(state) {
        if (this.state === state) {
            // Re-entering the same state can lead to unexpected behavior
            // so we should throw error to catch these types of mistakes
            throw new Error('Re-entering the current state is illegal');
        }

        var oldState;
        if ((oldState = this.state) && oldState.leave) {
            // console.log('Leaving state ' + oldState.name);
            oldState.leave(state);
        }

        this.state = state;

        // console.log('Entering state ' + state.name);
        if (state.enter) {
            state.enter();
        }
    },

    /**
     * Look ahead to see if the given str matches the substring sequence
     * beyond
     */
    lookAheadFor: function(str, callback) {
        // Have we read enough chunks to read the string that we need?
        var pos = this.pos;
        var len = str.length;
        var end = pos + len;
        if (end - 1 > this.maxPos) {
            return undefined;
        }

        var found = this.data.substring(pos, end);
        return (found === str) ? str : undefined;
    },

    /**
     * Look ahead to a character at a specific offset.
     * The callback will be invoked with the character
     * at the given position.
     */
    lookAtCharAhead: function(offset, callback) {
        // Since we increment this.pos immediately after a read, the
        // look-ahead offset needs to be decremented by 1
        return this.data.charAt(this.pos + offset - 1);
    },

    lookAtCharCodeAhead: function(offset, callback) {
        // Since we increment this.pos immediately after a read, the
        // look-ahead offset needs to be decremented by 1
        return this.data.charCodeAt(this.pos + offset - 1);
    },

    skip: function(offset) {
        this.pos += offset;
    },

    parse: function(data) {
        if (data == null) {
            return;
        }

        // call the constructor function again because we have a contract that
        // it will fully reset the parser
        Parser.call(this);

        this.data = data;
        this.maxPos = data.length - 1;

        // Enter initial state
        if (this.initialState) {
            this.enterState(this.initialState);
        }

        // Move to first position
        this.pos = 0;

        if (!this.state) {
            // Cannot resume when parser has no state
            return;
        }

        var pos;
        while ((pos = this.pos) <= this.maxPos) {
            var ch = data[pos];

            // move to next position
            this.pos++;

            // console.log('-- ' + JSON.stringify(ch) + ' --  ' + this.state.name.gray);

            // We assume that every state will have "char" function
            this.state.char(ch, ch.charCodeAt(0));
        }

        var state;
        if ((state = this.state) && state.eof) {
            state.eof();
        }
    }
};

module.exports = Parser;
