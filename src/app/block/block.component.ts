import { Component, Input, OnInit } from '@angular/core';
import { BlockType } from 'src/enums/BlockType.enum';

@Component({
  selector: 'app-block',
  templateUrl: './block.component.html',
  styleUrls: ['./block.component.scss']
})
export class BlockComponent {

  @Input() blockType!: BlockType;
  blockKey!: BlockType;
  invertedBlockType: any;

  ngOnInit(){
    const blockKeys = Object.keys(BlockType);
    const blockValues = Object.values(BlockType);

    this.invertedBlockType = {};

    blockValues.forEach((value, index) => {
      this.invertedBlockType[value] = blockKeys[index];
    });
  }

  ngOnChanges(): void {
    this.blockKey = BlockType[this.blockType as unknown as keyof typeof BlockType];
  }  
}
