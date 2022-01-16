declare module 'tinytar' {
  export type FileDescriptor = {
    name: string;
    mode: number;
    uid: number;
    gid: number;
    size: number;
    modifyTime: string;
    checksum: number;
    type: number; // 0 - regular file
    linkName: string;
    ustar: string;
    owner: string;
    group: string;
    majorNumber: number;
    minorNumber: number;
    prefix: string;
    accessTime: string;
    createTime: string;

    // Not sure which type fits better here, it's {[index: number]: number}
    data: Iterable<number>;
  };

  export function untar(data: Uint8Array): FileDescriptor[];
}
