// [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
//
// ## Description
// A formatter for abstract tickable objects, such as notes, chords,
// tabs, etc.

import { Vex } from './vex';
import { Fraction } from './fraction';

export class TickContext {
  static getNextContext(tContext) {
    var contexts = tContext.tContexts;
    var index = contexts.indexOf(tContext);

    return contexts[index+1];
  }

  constructor() {
    this.currentTick = new Fraction(0, 1);
    this.maxTicks = new Fraction(0, 1);
    this.minTicks = null;
    this.width = 0;
    this.padding = 3;     // padding on each side (width += padding * 2)
    this.pixelsUsed = 0;
    this.x = 0;
    this.tickables = [];   // Notes, tabs, chords, lyrics.
    this.notePx = 0;       // width of widest note in this context
    this.extraLeftPx = 0;  // Extra left pixels for modifers & displace notes
    this.extraRightPx = 0; // Extra right pixels for modifers & displace notes
    this.align_center = false;

    this.tContexts = [];   // Parent array of tick contexts

    // Ignore this tick context for formatting and justification
    this.ignore_ticks = true;
    this.preFormatted = false;
    this.postFormatted = false;
    this.context = null; // Rendering context
  }
  setContext(context) { this.context = context; return this; }
  getContext() { return this.context; }
  shouldIgnoreTicks() { return this.ignore_ticks; }
  getWidth() { return this.width + (this.padding * 2); }
  getX() { return this.x; }
  setX(x) { this.x = x; return this; }
  getPixelsUsed() { return this.pixelsUsed; }
  setPixelsUsed(pixelsUsed) { this.pixelsUsed = pixelsUsed; return this; }
  setPadding(padding) { this.padding = padding; return this; }
  getMaxTicks() { return this.maxTicks; }
  getMinTicks() { return this.minTicks; }
  getTickables() { return this.tickables; }
  getCenterAlignedTickables() {
    return this.tickables.filter(function(tickable) {
      return tickable.isCenterAligned();
    });
  }

  // Get widths context, note and left/right modifiers for formatting
  getMetrics() {
    return { width: this.width, notePx: this.notePx,
             extraLeftPx: this.extraLeftPx, extraRightPx: this.extraRightPx };
  }
  getCurrentTick() { return this.currentTick; }
  setCurrentTick(tick) {
    this.currentTick = tick;
    this.preFormatted = false;
  }

  // Get left & right pixels used for modifiers
  getExtraPx() {
    var left_shift = 0;
    var right_shift = 0;
    var extraLeftPx = 0;
    var extraRightPx = 0;
    for (var i = 0; i < this.tickables.length; i++) {
      extraLeftPx = Math.max(this.tickables[i].extraLeftPx, extraLeftPx);
      extraRightPx = Math.max(this.tickables[i].extraRightPx, extraRightPx);
      var mContext = this.tickables[i].modifierContext;
      if (mContext && mContext != null) {
        left_shift = Math.max( left_shift, mContext.state.left_shift);
        right_shift = Math.max( right_shift, mContext.state.right_shift);
      }
    }
    return { left: left_shift, right: right_shift,
             extraLeft: extraLeftPx, extraRight: extraRightPx };
  }
  addTickable(tickable) {
    if (!tickable) {
      throw new Vex.RERR("BadArgument", "Invalid tickable added.");
    }

    if (!tickable.shouldIgnoreTicks()) {
      this.ignore_ticks = false;

      var ticks = tickable.getTicks();

      if (ticks.greaterThan(this.maxTicks)) {
        this.maxTicks = ticks.clone();
      }

      if (this.minTicks == null) {
        this.minTicks = ticks.clone();
      } else if (ticks.lessThan(this.minTicks)) {
        this.minTicks = ticks.clone();
      }
    }

    tickable.setTickContext(this);
    this.tickables.push(tickable);
    this.preFormatted = false;
    return this;
  }
  preFormat() {
    if (this.preFormatted) return;

    for (var i = 0; i < this.tickables.length; ++i) {
      var tickable = this.tickables[i];
      tickable.preFormat();
      var metrics = tickable.getMetrics();

      // Maintain max extra pixels from all tickables in the context
      this.extraLeftPx = Math.max(this.extraLeftPx,
                                  metrics.extraLeftPx + metrics.modLeftPx);
      this.extraRightPx = Math.max(this.extraRightPx,
                                   metrics.extraRightPx + metrics.modRightPx);

      // Maintain the widest note for all tickables in the context
      this.notePx = Math.max(this.notePx, metrics.noteWidth);

      // Recalculate the tick context total width
      this.width = this.notePx +
                   this.extraLeftPx +
                   this.extraRightPx;
    }

    return this;
  }
  postFormat() {
    if (this.postFormatted) return this;
    this.postFormatted = true;
    return this;
  }
}
