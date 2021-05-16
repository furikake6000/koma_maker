// クリック・タッチに関するヘルパーを詰め込む
export default class ClickTouchHelper {
  private isPressing_: boolean;

  constructor() {
    this.isPressing_ = false;

    // isPressing用のEventListenerを仕掛ける
    const startTriggers = ['mousedown', 'touchstart'];
    const endTriggers = ['mouseup', 'touchend', 'touchcancel', 'onblur'];

    for(const trigger of startTriggers) {
      window.addEventListener(trigger, () => {
        this.isPressing_ = true;
      });
    }
    for(const trigger of endTriggers) {
      window.addEventListener(trigger, () => {
        this.isPressing_ = false;
      });
    }
  }

  // クリックだろうがタッチだろうが、今押してるか返してくれる
  public IsPressing(): boolean {
    return this.isPressing_;
  }
}
