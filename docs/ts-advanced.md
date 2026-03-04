# 📖 TypeScript 进阶教程

## 什么是 TypeScript？

TypeScript 是 JavaScript 的超集，它添加了类型系统和其他特性。

## 高级类型

### 1. 联合类型

```typescript
type StringOrNumber = string | number;

function printId(id: StringOrNumber): void {
    console.log(`ID: ${id}`);
}
```

### 2. 泛型

```typescript
interface Repository<T> {
    getById(id: string): Promise<T>;
    getAll(): Promise<T[]>;
    create(item: T): Promise<T>;
    update(id: string, item: Partial<T>): Promise<T>;
    delete(id: string): Promise<void>;
}
```

### 3. 条件类型

```typescript
type NonNullable<T> = T extends null | undefined ? never : T;
```

## 装饰器

```typescript
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
        console.log(`Calling ${propertyKey} with:`, args);
        return original.apply(this, args);
    };
}

class Calculator {
    @Log
    add(a: number, b: number): number {
        return a + b;
    }
}
```

## 总结

TypeScript 的类型系统非常强大，合理使用可以大大提高代码质量和可维护性。

---

*更新于 2024-01-10*
